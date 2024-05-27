import '@extras/testEnv';
import { test, expect } from 'vitest';
import * as helpers from './helpers';


test('txAdminASCII', () => {
    const result = helpers.txAdminASCII();
    expect(typeof result).toBe('string');
    expect(result.split('\n').length).toBe(6);
});

test('parseSchedule', () => {
    const result = helpers.parseSchedule(['12:30', '1:30', 'invalid', '1030']);
    expect(result).toBeTruthy();
    expect(result.valid).toEqual([
        { string: '12:30', hours: 12, minutes: 30 },
        { string: '01:30', hours: 1, minutes: 30 },
    ]);
    expect(result.invalid).toEqual(['invalid', '1030']);
});

test('redactApiKeys', () => {
    expect(helpers.redactApiKeys('')).toBe('')
    expect(helpers.redactApiKeys('abc')).toBe('abc')

    const example = `
    sv_licenseKey cfxk_NYWn5555555500000000_2TLnnn
    sv_licenseKey "cfxk_NYWn5555555500000000_2TLnnn"
    sv_licenseKey 'cfxk_NYWn5555555500000000_2TLnnn'
    
    steam_webApiKey A2FAF8CF83B87E795555555500000000
    sv_tebexSecret 238a98bec4c0353fee20ac865555555500000000
    rcon_password a5555555500000000
    rcon_password "a5555555500000000"
    rcon_password 'a5555555500000000'
    mysql_connection_string "mysql://root:root@localhost:3306/txAdmin"
    https://discord.com/api/webhooks/33335555555500000000/xxxxxxxxxxxxxxxxxxxx5555555500000000`;

    const result = helpers.redactApiKeys(example)
    expect(result).toContain('[REDACTED]');
    expect(result).toContain('2TLnnn');
    expect(result).not.toContain('5555555500000000');
    expect(result).not.toContain('mysql://');
})

test('now', () => {
    const result = helpers.now();
    expect(typeof result).toBe('number');
    expect(result.toString().length).toBe(10);
    expect(result.toString()).not.toContain('.');
    expect(result.toString()).not.toContain('-');
});

test('anyUndefined', () => {
    expect(helpers.anyUndefined(undefined, 'test')).toBe(true);
    expect(helpers.anyUndefined('test', 'xxxx')).toBe(false);
    expect(helpers.anyUndefined(undefined, undefined)).toBe(true);
});

test('calcExpirationFromDuration', () => {
    const currTs = helpers.now();
    let result = helpers.calcExpirationFromDuration('1 hour');
    expect(result?.duration).toBe(3600);
    expect(result?.expiration).toBe(currTs + 3600);

    result = helpers.calcExpirationFromDuration('1 hours');
    expect(result?.duration).toBe(3600);

    result = helpers.calcExpirationFromDuration('permanent');
    expect(result?.expiration).toBe(false);

    expect(() => helpers.calcExpirationFromDuration('x day')).toThrowError('multiplier');
    expect(() => helpers.calcExpirationFromDuration('')).toThrowError('multiplier');
    expect(() => helpers.calcExpirationFromDuration('-1 day')).toThrowError('multiplier');
});

test('parsePlayerId', () => {
    let result = helpers.parsePlayerId('FIVEM:555555');
    expect(result.isIdValid).toBe(true);
    expect(result.idType).toBe('fivem');
    expect(result.idValue).toBe('555555');
    expect(result.idlowerCased).toBe('fivem:555555');

    result = helpers.parsePlayerId('fivem:xxxxx');
    expect(result.isIdValid).toBe(false);
});

test('parsePlayerIds', () => {
    const result = helpers.parsePlayerIds(['fivem:555555', 'fivem:xxxxx']);
    expect(result.validIdsArray).toEqual(['fivem:555555']);
    expect(result.invalidIdsArray).toEqual(['fivem:xxxxx']);
    expect(result.validIdsObject?.fivem).toBe('555555');
});

test('filterPlayerHwids', () => {
    const result = helpers.filterPlayerHwids([
        '5:55555555000000002d267c6638c8873d55555555000000005555555500000000',
        'invalidHwid'
    ]);
    expect(result.validHwidsArray).toEqual(['5:55555555000000002d267c6638c8873d55555555000000005555555500000000']);
    expect(result.invalidHwidsArray).toEqual(['invalidHwid']);
});

test('parseLaxIdsArrayInput', () => {
    const result = helpers.parseLaxIdsArrayInput('55555555000000009999, steam:1100001ffffffff, invalid');
    expect(result.validIds).toEqual(['discord:55555555000000009999', 'steam:1100001ffffffff']);
    expect(result.invalids).toEqual(['invalid']);
});

test('getIdFromOauthNameid', () => {
    expect(helpers.getIdFromOauthNameid('https://forum.cfx.re/internal/user/555555')).toBe('fivem:555555');
    expect(helpers.getIdFromOauthNameid('xxxxx')).toBe(false);
});

test('parseLimitedFloat', () => {
    expect(helpers.parseLimitedFloat('123.4567899999')).toBe(123.45679);
    expect(helpers.parseLimitedFloat(123.4567899999)).toBe(123.45679);
    expect(helpers.parseLimitedFloat(123.4567899999, 2)).toBe(123.46);
    expect(helpers.parseLimitedFloat(0.1+0.2)).toBe(0.3);
});

test('parseFxserverVersion', () => {
    const fnc = helpers.parseFxserverVersion;
    expect(() => fnc(1111 as any)).toThrow('expected');
    expect(fnc('FXServer-master v1.0.0.8202 linux')).toEqual({ build: 8202, platform: 'linux' });
    expect(fnc('FXServer-master SERVER v1.0.0.8214 win32')).toEqual({ build: 8214, platform: 'windows' });
    expect(fnc('FXServer-no-version (didn\'t run build tools?)')).toEqual({ build: null, platform: null });
    expect(fnc('FXServer-master v1.0.0.xxx linux')).toEqual({ build: null, platform: 'linux' });
});
