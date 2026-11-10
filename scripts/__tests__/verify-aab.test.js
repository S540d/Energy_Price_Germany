/**
 * Tests für scripts/verify-aab.js (#540).
 *
 * vc31 lief nur durch D8 (Play Console: Verschleierung 1 %). Das Skript soll
 * einen solchen Build vor dem Upload erkennen.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const {
  checkGradleProperties,
  analyzeEntries,
  estimateObfuscation,
  main,
} = require('../verify-aab');

const R8 = 'BUNDLE-METADATA/com.android.tools/r8.json';
const D8 = 'BUNDLE-METADATA/com.android.tools/d8.json';
const MAP = 'BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map';
const MB = 1024 * 1024;

describe('checkGradleProperties', () => {
  it('akzeptiert beide R8-Schalter auf true', () => {
    const content = [
      '# generated',
      'android.enableMinifyInReleaseBuilds=true',
      'android.enableShrinkResourcesInReleaseBuilds = true',
    ].join('\n');
    expect(checkGradleProperties(content)).toEqual([]);
  });

  it('meldet fehlende und abgeschaltete Schalter', () => {
    const errors = checkGradleProperties('android.enableMinifyInReleaseBuilds=false\n');
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/enableMinifyInReleaseBuilds ist "false"/);
    expect(errors[1]).toMatch(/enableShrinkResourcesInReleaseBuilds ist nicht gesetzt/);
  });

  it('ignoriert auskommentierte Zeilen', () => {
    const content =
      '#android.enableMinifyInReleaseBuilds=true\nandroid.enableShrinkResourcesInReleaseBuilds=true';
    expect(checkGradleProperties(content)).toHaveLength(1);
  });
});

describe('analyzeEntries', () => {
  const dex = (n, size) => ({ name: `base/dex/classes${n}.dex`, size });

  it('akzeptiert einen R8-Build mit Mapping', () => {
    const r = analyzeEntries([
      { name: R8, size: 100 },
      { name: MAP, size: 5 * MB },
      dex('', 6 * MB),
      dex('2', 2 * MB),
    ]);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.dexCount).toBe(2);
    expect(r.dexBytes).toBe(8 * MB);
  });

  it('erkennt den vc31-Fall: D8, kein Mapping, ~26 MB DEX', () => {
    const r = analyzeEntries([
      { name: D8, size: 100 },
      dex('', 9.5 * MB),
      dex('2', 10.1 * MB),
      dex('3', 6.3 * MB),
    ]);
    expect(r.errors).toHaveLength(3);
    expect(r.errors.join('\n')).toMatch(/nur durch D8/);
    expect(r.errors.join('\n')).toMatch(/r8\.json fehlt/);
    expect(r.errors.join('\n')).toMatch(/proguard\.map fehlt/);
    expect(r.warnings[0]).toMatch(/DEX-Gesamtgröße 25\.9 MB/);
  });

  it('meldet fehlende DEX-Dateien', () => {
    const r = analyzeEntries([{ name: R8, size: 1 }, { name: MAP, size: 1 }]);
    expect(r.errors).toEqual(['keine DEX-Dateien unter base/dex/ gefunden']);
  });
});

describe('estimateObfuscation', () => {
  it('zählt nur Klassenzeilen und vergleicht alten mit neuem Namen', () => {
    const mapping = [
      '# compiler: R8',
      'com.example.Foo -> a.a:',
      '    int bar -> b',
      '    1:1:void baz():10:10 -> c',
      'com.example.Kept -> com.example.Kept:',
      'com.example.Other -> a.b:',
    ].join('\n');
    expect(estimateObfuscation(mapping)).toEqual({ total: 3, renamed: 2, ratio: 2 / 3 });
  });

  it('liefert 0 für leeres Mapping', () => {
    expect(estimateObfuscation('')).toEqual({ total: 0, renamed: 0, ratio: 0 });
  });
});

describe('main (mit echtem ZIP)', () => {
  let dir;
  let errSpy;
  let warnSpy;
  let logSpy;

  const makeAab = (files) => {
    for (const [name, content] of Object.entries(files)) {
      const target = path.join(dir, 'src', name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    const aab = path.join(dir, 'app.aab');
    execFileSync('zip', ['-qr', aab, '.'], { cwd: path.join(dir, 'src') });
    return aab;
  };

  // Lokales android/gradle.properties des Entwicklers darf die Tests nicht beeinflussen
  const opts = () => ({ gradleProperties: path.join(dir, 'none.properties') });

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-aab-'));
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    errSpy.mockRestore();
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('besteht für einen R8-Build mit hoher Verschleierung', () => {
    const aab = makeAab({
      [R8]: '{}',
      [MAP]: 'com.example.A -> a.a:\ncom.example.B -> a.b:\n',
      'base/dex/classes.dex': 'dex',
    });
    expect(main([aab], opts())).toBe(0);
    expect(errSpy).not.toHaveBeenCalled();
    expect(logSpy.mock.calls.flat().join('\n')).toMatch(/2\/2 Klassen umbenannt \(100 %\)/);
  });

  it('schlägt für einen D8-Build fehl', () => {
    const aab = makeAab({ [D8]: '{}', 'base/dex/classes.dex': 'dex' });
    expect(main([aab], opts())).toBe(1);
    expect(errSpy.mock.calls.flat().join('\n')).toMatch(/nur durch D8/);
  });

  it('warnt bei geschätzter Verschleierung unter 25 %', () => {
    const aab = makeAab({
      [R8]: '{}',
      [MAP]: 'a.A -> a.A:\na.B -> a.B:\na.C -> a.C:\na.D -> x.y:\na.E -> a.E:\n',
      'base/dex/classes.dex': 'dex',
    });
    expect(main([aab], opts())).toBe(0);
    expect(warnSpy.mock.calls.flat().join('\n')).toMatch(/Verschleierung 20 % < 25 %/);
  });

  it('--prebuild prüft nur gradle.properties', () => {
    const props = path.join(dir, 'gradle.properties');
    fs.writeFileSync(props, 'android.enableMinifyInReleaseBuilds=true\n');
    expect(main(['--prebuild'], { gradleProperties: props })).toBe(1);
    expect(main(['--prebuild'], opts())).toBe(1);
    fs.appendFileSync(props, 'android.enableShrinkResourcesInReleaseBuilds=true\n');
    expect(main(['--prebuild'], { gradleProperties: props })).toBe(0);
  });

  it('schlägt fehl, wenn das AAB fehlt', () => {
    expect(main([path.join(dir, 'missing.aab')], opts())).toBe(1);
    expect(errSpy.mock.calls.flat().join('\n')).toMatch(/AAB nicht gefunden/);
  });
});
