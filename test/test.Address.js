'use strict';

var chai = chai || require('chai');
var bitcore = bitcore || require('../bitcore');

var should = chai.should();

var Address = bitcore.Address;
var Key = bitcore.Key;

describe('Address', function() {
  it('should be able to create class', function() {
    should.exist(Address);
  });
  it('should be able to create instance', function() {
    var a = new Address('sbiBUHm5nmKAypAZUaicLvMBAqGHj3GA1a');
    should.exist(a);
  });
  var data = [
    ['sbiBUHm5nmKAypAZUaicLvMBAqGHj3GA1a', true],
    ['11111111111111111111111111122222234', false], // totally invalid
    ['32QBdjycLwbDTuGafUwaU5p5GxzSLPYoF6', true],
    ['1Q1pE5vPGEEMqRcVRMbtBK842Y6Pzo6nK9', true],
    ['sQCBqDw1hTNAwBLYL8naUBXduvxs6cu59h', true],
    ['1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW600', false],  // bad checksum
    ['1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW620', false],  // bad checksum
    ['1ANNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62i', false],  // data changed, original checksum.
    ['1A Na15ZQXAZUgFiqJ2i7Z2DPU2J6hW62i', false],  // invalid chars
    ['1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62j', false],  // checksums don't match.
    ['1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62!', false],  // bad char (!)
    ['1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62iz', false], // too long Bitcoin address
    ['1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62izz', false],// too long Bitcoin address
    ['2cFupjhnEsSn59qHXstmK2ffpLv2', false],        // valid base58 invalid data
    ['dB7cwYdcPSgiyAwKWL3JwCVwSk6epU2txw', false],  // valid base58, valid length, invalid network
    ['2MnmgiRH4eGLyLc9eAqStzk7dFgBjFtUCtu', false],  // valid base58, valid length, invalid network
    ['32QBdjycLwbDTuGafUwaU5p5GxzSLPYoF6', true],  // valid base58, valid length, valid network
  ];
  data.forEach(function(datum) {
    var address = datum[0];
    var result = datum[1];
    it('should validate correctly ' + address, function() {
      var a = new Address(address);
      var s = a.toString();

      a.isValid().should.equal(result);
      s.should.equal(a.toString()); // check that validation doesn't change data
    });
  });
  it('should be able to detect network from an address', function() {
    // bitcoin
    var a = new Address('1KfyjCgBSMsLqiCbakfSdeoBUqMqLUiu3T');
    a.network().name.should.equal('bitcoin');
    a = new Address('1dice8EMZmqKvrGE4Qc9bUFf9PX3xaYDp');
    a.network().name.should.equal('bitcoin');
    //p2sh
    a = new Address('DbiBUHm5nmKAypAZUaicLvMBAqGHj3GA1a');
    a.network().name.should.equal('dicecoin');

    //testnet
    a = new Address('mrPnbY1yKDBsdgbHbS7kJ8GVm8F66hWHLE');
    a.network().name.should.equal('testnet');
    a = new Address('n2ekxibY5keRiMaoKFGfiNfXQCS4zTUpct');
    a.network().name.should.equal('testnet');

    //p2sh
    a = new Address('2NBSBcf2KfjPEEqVusmrWdmUeNHRiUTS3Li');
    a.network().name.should.equal('testnet');
  });
  it('#isScript should work', function() {
    // invalid
    new Address('1T').isScript().should.equal(false);
    // pubKeyHash dicecoin
    new Address('DbiBUHm5nmKAypAZUaicLvMBAqGHj3GA1a').isScript().should.equal(false);
    // script bitcoin
    new Address('3QRhucKtEn5P9i7YPxzXCqBtPJTPbRFycn').isScript().should.equal(true);
    // pubKeyHash testnet
    new Address('mrPnbY1yKDBsdgbHbS7kJ8GVm8F66hWHLE').isScript().should.equal(false);
    // script testnet
    new Address('2NBSBcf2KfjPEEqVusmrWdmUeNHRiUTS3Li').isScript().should.equal(true);
  });

  describe('#fromPubKey', function() {
    it('should make pubkeyhash address from an uncompressed public key', function() {
      var pubkey = new Buffer('040CD920F6F59B5DE3D808A72CB4961DE8E9209DD6BE542A791AAB601A05C88EBC7D1AE06B6C05671797FA911E418A4B9A8E9CA6019666F4C8A96817F1A51CB2E7', 'hex');
      var hash = bitcore.util.x11Digest(pubkey);
      var addr = new Address(0, hash);
      addr.toString().should.equal(Address.fromPubKey(pubkey, 'bitcoin').toString());
    });
  });
  describe('#fromKey', function() {
    it('should make this pubkeyhash address from uncompressed this public key', function() {
      var k = new Key();
      k.private = new Buffer('030CD920F6F59B5DE3D808A72CB4961DE8E9209DD6BE542A791AAB601A05C88EBC', 'hex');
      k.compressed = true;
      k.regenerateSync();
      var a = Address.fromKey(k, 'dicecoin');
      a.toString().should.equal('DQCBqDw1hTNAwBLYL8naUBXduvxs6cu59h');
    });
  });


  describe('#fromPubKeys', function() {
    it('should make this p2sh multisig address from these pubkeys', function() {
      var pubkey1 = new Buffer('03e0973263b4e0d5f5f56d25d430e777ab3838ff644db972c0bf32c31da5686c27', 'hex');
      var pubkey2 = new Buffer('0371f94c57cc013507101e30794161f4e6b9efd58a9ea68838daf429b7feac8cb2', 'hex');
      var pubkey3 = new Buffer('032c0d2e394541e2efdc7ac3500e16e7e69df541f38670402e95aa477202fa06bb', 'hex');
      var sortedPubKeys = [pubkey3, pubkey2, pubkey1];
      var mReq = 2;
      var script = bitcore.Script.createMultisig(mReq, sortedPubKeys, {noSorting: true});
      var hash = bitcore.util.sha256ripe160(script.getBuffer());
      var version = bitcore.networks['bitcoin'].P2SHVersion;
      var addr = new Address(version, hash);
      var addr2 = Address.fromPubKeys(mReq, sortedPubKeys, 'bitcoin');
      addr.toString().should.equal(addr2.toString());
    });
  });

  describe('#fromScript', function() {
    it('should make this p2sh multisig address from these pubkeys', function() {
      var pubkey1 = new Buffer('03e0973263b4e0d5f5f56d25d430e777ab3838ff644db972c0bf32c31da5686c27', 'hex');
      var pubkey2 = new Buffer('0371f94c57cc013507101e30794161f4e6b9efd58a9ea68838daf429b7feac8cb2', 'hex');
      var pubkey3 = new Buffer('032c0d2e394541e2efdc7ac3500e16e7e69df541f38670402e95aa477202fa06bb', 'hex');
      var pubKeys = [pubkey1, pubkey2, pubkey3];
      var mReq = 2;
      var script = bitcore.Script.createMultisig(mReq, pubKeys);
      var addr = Address.fromScript(script, 'bitcoin');
      var addr2 = Address.fromPubKeys(mReq, pubKeys, 'bitcoin');
      addr.toString().should.equal(addr2.toString());

      // Same case, using HEX
      var scriptHex = bitcore.Script.createMultisig(mReq, pubKeys).getBuffer().toString('hex');
      var addrB = Address.fromScript(scriptHex, 'bitcoin');
      var addr2B = Address.fromPubKeys(mReq, pubKeys, 'bitcoin');
      addrB.toString().should.equal(addr2B.toString());
 
    });

    it('it should make this hand-crafted address', function() {
      var pubkey1 = new Buffer('03e0973263b4e0d5f5f56d25d430e777ab3838ff644db972c0bf32c31da5686c27', 'hex');
      var pubkey2 = new Buffer('0371f94c57cc013507101e30794161f4e6b9efd58a9ea68838daf429b7feac8cb2', 'hex');
      var pubkey3 = new Buffer('032c0d2e394541e2efdc7ac3500e16e7e69df541f38670402e95aa477202fa06bb', 'hex');
      var pubKeys = [pubkey1, pubkey2, pubkey3];
      var mReq = 2;
      var script = bitcore.Script.createMultisig(mReq, pubKeys);
      var addr = Address.fromScript(script, 'bitcoin');
      
      var hash = bitcore.util.sha256ripe160(script.getBuffer());
      var version = bitcore.networks['bitcoin'].P2SHVersion;
      var addr2 = new Address(version, hash);

      addr.toString().should.equal(addr2.toString());
    });
  });


  describe('#fromScriptPubKey', function() {

    // All examples checked againt bitcoind decodescript
    var cases = [
      ['76a91423b7530a00dd7951e11791c529389421c0b8d83b88ac', 'mimoZNLcP2rrMRgdeX5PSnR7AjCqQveZZ4'],
      ['a9147049be48e74a660157da3ed64569981592f7fa0587','2N3Ux1YTnt1ixofYvJfaabqZSj2MBF3jsmv'],
      ['76a914774e603bafb717bd3f070e68bbcccfd907c77d1388ac', 'mrPnbY1yKDBsdgbHbS7kJ8GVm8F66hWHLE'],
      ['76a914b00127584485a7cff0949ef0f6bc5575f06ce00d88ac', 'mwZabyZXg8JzUtFX1pkGygsMJjnuqiNhgd'],
      ['532103bf025eb410407aec5a67c975ce222e363bb88c69bb1acce45d20d85602df2ec52103d76dd6d99127f4b733e772f0c0a09c573ac7e4d69b8bf50272292da2e093de2c2103dd9acd8dd1816c825d6b0739339c171ae2cb10efb53699680537865b07086e9b2102371cabbaf466c3a536034b4bda64ad515807bffd87488f44f93c2373d4d189c9210264cd444358f8d57f8637a7309f9736806f4883aebc4fe7da4bad1e4b37f2d12c55ae', [
          "n4JAZc4cJimQbky5wxZUEDeAFZtGaZrjWK",
          "msge5muNmBSRDn5nsaRcHCU6dg2zimA8wQ",
          "mvz9MjocpyXdgXqRcZYazsdE8iThdvjdhk",
          "miQGZ2gybQe7UvUQDBYsgcctUteij5pTpm",
          "mu9kmhGrzREKsWaXUEUrsRLLMG4UMPy1LF"
      ]]
    ];

    for(var i in cases){
      var c=cases[i];
      it('it should generate the right address', function(){
        if (typeof c[1] === 'string') {
          (new Address.fromScriptPubKey(c[0],'testnet')).toString().should.equal(c[1]);
          var s = new bitcore.Script(new Buffer(c[0],'hex'));
          (new Address.fromScriptPubKey(s,'testnet')).toString().should.equal(c[1]);
        }
        else {
          var as=new Address.fromScriptPubKey(c[0],'testnet');
          for(var j in as){
            as[j].toString().should.equal(c[1][j]);
          }
        }
      });
    }
  });
 
});
