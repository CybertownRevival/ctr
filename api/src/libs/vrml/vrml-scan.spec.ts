import {
  classifyUrl,
  externalReferences,
  FINDING_BAD_HEADER,
  FINDING_MALFORMED_VRML,
  FINDING_MULTIPLE_WORLDINFO,
  FINDING_NO_WORLDINFO,
  scanVrml,
  summariseNodeCounts,
  textureReferences,
} from './vrml-scan';

const HEADER = '#VRML V2.0 utf8';

function withHeader(body: string): string {
  return `${HEADER}\n${body}`;
}

describe('scanVrml - header', () => {
  it('reads the first line verbatim and recognises VRML97', () => {
    const scan = scanVrml(withHeader('Shape {}'));

    expect(scan.header).toBe(HEADER);
    expect(scan.headerIsVrml97).toBe(true);
    expect(scan.warnings).not.toContain(FINDING_BAD_HEADER);
  });

  it('tolerates a CRLF header', () => {
    expect(scanVrml(`${HEADER}\r\nShape {}`).headerIsVrml97).toBe(true);
  });

  it('flags a non-VRML97 header', () => {
    const scan = scanVrml('#VRML V1.0 ascii\nSeparator {}');

    expect(scan.headerIsVrml97).toBe(false);
    expect(scan.warnings).toContain(FINDING_BAD_HEADER);
  });

  it('flags an empty file rather than throwing', () => {
    const scan = scanVrml('');

    expect(scan.header).toBeNull();
    expect(scan.warnings).toContain(FINDING_BAD_HEADER);
  });
});

describe('scanVrml - WorldInfo', () => {
  it('extracts the title and every info entry', () => {
    const scan = scanVrml(withHeader(`
      WorldInfo {
        title "Pocket Moon Playset"
        info [
          "Made By: BassMekanik"
          "Uploaded: August, 2026"
          "Mall Price: 75 CC"
        ]
      }
    `));

    expect(scan.worldInfo).toHaveLength(1);
    expect(scan.worldInfo[0].title).toBe('Pocket Moon Playset');
    expect(scan.worldInfo[0].info).toEqual([
      'Made By: BassMekanik',
      'Uploaded: August, 2026',
      'Mall Price: 75 CC',
    ]);
  });

  it('handles a single-string info field', () => {
    const scan = scanVrml(withHeader('WorldInfo { info "just one" }'));

    expect(scan.worldInfo[0].info).toEqual(['just one']);
  });

  it('tolerates comments and odd spacing between a field and its value', () => {
    const scan = scanVrml(withHeader(`
      WorldInfo {
        title    # the object name follows
                 "Spaced Out"
      }
    `));

    expect(scan.worldInfo[0].title).toBe('Spaced Out');
  });

  it('preserves escaped quotes and unicode in info entries', () => {
    const scan = scanVrml(withHeader('WorldInfo { info [ "say \\"hi\\"" "café ☃" ] }'));

    expect(scan.worldInfo[0].info).toEqual(['say "hi"', 'café ☃']);
  });

  it('reports a missing WorldInfo', () => {
    const scan = scanVrml(withHeader('Shape {}'));

    expect(scan.worldInfo).toHaveLength(0);
    expect(scan.warnings).toContain(FINDING_NO_WORLDINFO);
  });

  it('reports every WorldInfo when there is more than one', () => {
    const scan = scanVrml(withHeader(`
      WorldInfo { title "First" }
      Group { children [ ] }
      WorldInfo { title "Second" }
    `));

    expect(scan.worldInfo.map(node => node.title)).toEqual(['First', 'Second']);
    expect(scan.warnings).toContain(FINDING_MULTIPLE_WORLDINFO);
  });

  it('does not mistake a title field of another node for WorldInfo', () => {
    const scan = scanVrml(withHeader('Anchor { description "not a title" }'));

    expect(scan.worldInfo).toHaveLength(0);
  });
});

describe('scanVrml - node counting', () => {
  it('counts node types, including inside DEF', () => {
    const scan = scanVrml(withHeader(`
      WorldInfo { title "x" }
      DEF Root Group {
        children [
          Shape { geometry Box {} }
          Shape { geometry Sphere {} }
        ]
      }
    `));

    expect(scan.nodeCounts.Group).toBe(1);
    expect(scan.nodeCounts.Shape).toBe(2);
    expect(scan.nodeCounts.Box).toBe(1);
    // "Root" is a DEF name, not a node type.
    expect(scan.nodeCounts.Root).toBeUndefined();
  });

  it('does not count USE references as new nodes', () => {
    const scan = scanVrml(withHeader('Group { children [ DEF A Shape {} USE A ] }'));

    expect(scan.nodeCounts.Shape).toBe(1);
  });

  it('counts forbidden nodes when they are genuinely present', () => {
    const scan = scanVrml(withHeader(`
      WorldInfo { title "x" }
      Sound { source AudioClip { url "beep.wav" } }
      DirectionalLight { on FALSE }
      Inline { url "other.wrl" }
    `));

    const summary = summariseNodeCounts(scan);
    expect(summary.Sound).toBe(1);
    expect(summary.DirectionalLight).toBe(1);
    expect(summary.Inline).toBe(1);
  });

  it('does NOT count node names that appear only inside a comment', () => {
    const scan = scanVrml(withHeader(`
      WorldInfo { title "x" }
      # this object has no Sound { } and no DirectionalLight { }
      Shape {}
    `));

    const summary = summariseNodeCounts(scan);
    expect(summary.Sound).toBe(0);
    expect(summary.DirectionalLight).toBe(0);
  });

  it('does NOT count node names that appear only inside a Script string', () => {
    const scan = scanVrml(withHeader(`
      WorldInfo { title "x" }
      Script {
        url [ "javascript: function f() { /* Sound { } Inline { } */ }" ]
      }
    `));

    const summary = summariseNodeCounts(scan);
    expect(summary.Script).toBe(1);
    expect(summary.Sound).toBe(0);
    expect(summary.Inline).toBe(0);
  });

  it('does NOT count a node name inside a WorldInfo info entry', () => {
    const scan = scanVrml(withHeader(
      'WorldInfo { info [ "Contains no Sound { } or Billboard { }" ] }',
    ));

    expect(summariseNodeCounts(scan).Sound).toBe(0);
    expect(summariseNodeCounts(scan).Billboard).toBe(0);
  });

  it('sums H-Anim container nodes under hAnim', () => {
    const scan = scanVrml(withHeader('Humanoid { joints [ Joint {} Joint {} ] }'));

    expect(summariseNodeCounts(scan).hAnim).toBe(3);
  });

  it('publishes a stable key set even for an empty object', () => {
    const summary = summariseNodeCounts(scanVrml(withHeader('Shape {}')));

    expect(Object.keys(summary)).toContain('ImageTexture');
    expect(Object.keys(summary)).toContain('hAnim');
    expect(summary.ImageTexture).toBe(0);
  });
});

describe('scanVrml - PROTO and EXTERNPROTO', () => {
  it('records PROTO definitions and does not confuse the body for a node', () => {
    const scan = scanVrml(withHeader(`
      WorldInfo { title "x" }
      PROTO Wheel [ field SFFloat radius 1 ] {
        Shape { geometry Cylinder {} }
      }
      Wheel {}
    `));

    expect(scan.protoDefinitions).toEqual(['Wheel']);
    expect(scan.nodeCounts.Cylinder).toBe(1);
    expect(scan.warnings).not.toContain(FINDING_MALFORMED_VRML);
  });

  it('records EXTERNPROTO definitions and their url list', () => {
    const scan = scanVrml(withHeader(
      'EXTERNPROTO Tree [ field SFFloat h ] [ "http://example.com/tree.wrl#Tree" ]',
    ));

    expect(scan.externProtoDefinitions).toEqual(['Tree']);
    expect(scan.urls).toEqual([
      expect.objectContaining({
        node: 'EXTERNPROTO',
        value: 'http://example.com/tree.wrl#Tree',
        kind: 'external',
      }),
    ]);
    expect(summariseNodeCounts(scan).EXTERNPROTO).toBe(1);
  });
});

describe('scanVrml - references', () => {
  it('classifies url values', () => {
    expect(classifyUrl('wood.jpg')).toBe('local');
    expect(classifyUrl('textures/wood.jpg')).toBe('relative');
    expect(classifyUrl('textures\\wood.jpg')).toBe('relative');
    expect(classifyUrl('/assets/wood.jpg')).toBe('absolute');
    expect(classifyUrl('http://example.com/wood.jpg')).toBe('external');
    expect(classifyUrl('https://example.com/wood.jpg')).toBe('external');
    expect(classifyUrl('data:image/png;base64,AAAA')).toBe('data');
    expect(classifyUrl('   ')).toBe('empty');
  });

  it('classifies inline script bodies as script, not external', () => {
    // Real Mall objects put ECMAScript source directly in a Script node's url.
    // Treating that as a network reference would wrongly flag the object as
    // breaking the "no external source" texture rule.
    expect(classifyUrl('vrmlscript:\nfunction f() { return 1; }')).toBe('script');
    expect(classifyUrl('javascript: function f() {}')).toBe('script');
    expect(classifyUrl('ecmascript: var a = 1;')).toBe('script');
  });

  it('excludes inline script bodies from external references', () => {
    const scan = scanVrml(withHeader(`
      DEF Anim Script {
        url "vrmlscript: function activated(active, t) { state = TRUE; }"
      }
    `));

    expect(externalReferences(scan)).toEqual([]);
    expect(scan.urls[0].kind).toBe('script');
  });

  it('collects a single local texture reference', () => {
    const scan = scanVrml(withHeader(
      'Shape { appearance Appearance { texture ImageTexture { url "wood.jpg" } } }',
    ));

    expect(textureReferences(scan)).toEqual([
      expect.objectContaining({ node: 'ImageTexture', value: 'wood.jpg', kind: 'local' }),
    ]);
  });

  it('de-duplicates the same texture used twice', () => {
    const scan = scanVrml(withHeader(`
      Shape { appearance Appearance { texture ImageTexture { url "wood.jpg" } } }
      Shape { appearance Appearance { texture ImageTexture { url "wood.jpg" } } }
    `));

    expect(summariseNodeCounts(scan).ImageTexture).toBe(2);
    expect(textureReferences(scan)).toHaveLength(1);
  });

  it('reports multiple distinct textures separately', () => {
    const scan = scanVrml(withHeader(`
      Shape { appearance Appearance { texture ImageTexture { url "a.jpg" } } }
      Shape { appearance Appearance { texture ImageTexture { url [ "b.jpg" "c.jpg" ] } } }
    `));

    expect(textureReferences(scan).map(reference => reference.value))
      .toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
  });

  it('reports no textures when there are none', () => {
    expect(textureReferences(scanVrml(withHeader('Shape {}')))).toEqual([]);
  });

  it('treats external and absolute references as escaping the object directory', () => {
    const scan = scanVrml(withHeader(`
      Shape { appearance Appearance { texture ImageTexture { url "http://x.test/a.jpg" } } }
      Shape { appearance Appearance { texture ImageTexture { url "/assets/b.jpg" } } }
      Shape { appearance Appearance { texture ImageTexture { url "c.jpg" } } }
    `));

    expect(externalReferences(scan).map(reference => reference.value))
      .toEqual(['http://x.test/a.jpg', '/assets/b.jpg']);
  });

  it('captures Background side urls, which also leave the directory', () => {
    const scan = scanVrml(withHeader('Background { backUrl "http://x.test/back.jpg" }'));

    expect(externalReferences(scan)).toHaveLength(1);
  });
});

describe('scanVrml - viewpoints', () => {
  it('records viewpoint DEF names and descriptions', () => {
    const scan = scanVrml(withHeader(`
      DEF Cockpit Viewpoint { description "Pilot seat" }
      Viewpoint { position 0 0 10 }
    `));

    expect(scan.viewpoints).toEqual([
      { defName: 'Cockpit', description: 'Pilot seat' },
      { defName: null, description: null },
    ]);
    expect(summariseNodeCounts(scan).Viewpoint).toBe(2);
  });
});

describe('scanVrml - malformed input', () => {
  it('flags an unterminated string but still returns what it read', () => {
    const scan = scanVrml(withHeader('WorldInfo { title "never closed'));

    expect(scan.warnings).toContain(FINDING_MALFORMED_VRML);
    expect(scan.worldInfo[0].title).toBe('never closed');
  });

  it('flags unbalanced braces', () => {
    expect(scanVrml(withHeader('Group { children [ Shape {')).warnings)
      .toContain(FINDING_MALFORMED_VRML);
    expect(scanVrml(withHeader('Shape {} }')).warnings)
      .toContain(FINDING_MALFORMED_VRML);
  });

  it('never throws on arbitrary non-VRML bytes', () => {
    expect(() => scanVrml('  not vrml at all " [ { }')).not.toThrow();
  });
});

describe('scanVrml - WorldInfo inside a PROTO is not the object metadata', () => {
  const PROTO_AND_SCENE = withHeader(`
PROTO Example [] {
  WorldInfo {
    title "Prototype metadata"
  }
}

WorldInfo {
  title "Actual object"
}
`);

  it('compares against the scene-level node, not the PROTO-local one', () => {
    const scan = scanVrml(PROTO_AND_SCENE);

    expect(scan.worldInfo).toHaveLength(1);
    expect(scan.worldInfo[0].title).toBe('Actual object');
    expect(scan.warnings).not.toContain(FINDING_MULTIPLE_WORLDINFO);
  });

  it('still reports the PROTO-local node separately', () => {
    const scan = scanVrml(PROTO_AND_SCENE);

    expect(scan.protoWorldInfo).toHaveLength(1);
    expect(scan.protoWorldInfo[0].title).toBe('Prototype metadata');
  });

  it('treats a file whose only WorldInfo is PROTO-local as having none', () => {
    const scan = scanVrml(withHeader(`
PROTO Example [] {
  WorldInfo {
    title "Prototype metadata"
  }
}
Shape {}
`));

    expect(scan.worldInfo).toHaveLength(0);
    expect(scan.warnings).toContain(FINDING_NO_WORLDINFO);
  });

  it('still reports two scene-level nodes as multiple', () => {
    const scan = scanVrml(withHeader(`
WorldInfo { title "One" }
WorldInfo { title "Two" }
`));

    expect(scan.worldInfo).toHaveLength(2);
    expect(scan.warnings).toContain(FINDING_MULTIPLE_WORLDINFO);
  });

  it('does not lose a scene WorldInfo nested inside ordinary grouping nodes', () => {
    const scan = scanVrml(withHeader(`
Transform {
  children [
    WorldInfo { title "Nested but real" }
  ]
}
`));

    expect(scan.worldInfo).toHaveLength(1);
    expect(scan.worldInfo[0].title).toBe('Nested but real');
  });
});

describe('externalReferences - a relative path can still leave the directory', () => {
  function urlsOf(url: string) {
    return externalReferences(scanVrml(withHeader(
      `Shape { appearance Appearance { texture ImageTexture { url "${url}" } } }`,
    ))).map(reference => reference.value);
  }

  it('flags a parent-traversal reference', () => {
    expect(urlsOf('../wood.jpg')).toEqual(['../wood.jpg']);
    expect(urlsOf('textures/../../secret.jpg')).toEqual(['textures/../../secret.jpg']);
  });

  it('leaves an object-local subdirectory alone', () => {
    expect(urlsOf('textures/wood.jpg')).toEqual([]);
    expect(urlsOf('textures/sub/wood.jpg')).toEqual([]);
    expect(urlsOf('wood.jpg')).toEqual([]);
  });

  it('does not flag a traversal that resolves back inside', () => {
    expect(urlsOf('textures/../wood.jpg')).toEqual([]);
  });

  it('still flags absolute and off-host references', () => {
    expect(urlsOf('/etc/passwd')).toEqual(['/etc/passwd']);
    expect(urlsOf('http://example.com/wood.jpg')).toEqual(['http://example.com/wood.jpg']);
  });
});

describe('scanVrml - truncation is not malformed structure', () => {
  it('does not call a file malformed just because scanning stopped early', () => {
    // Three tokens per Shape, so this comfortably passes DEFAULT_MAX_TOKENS
    // while leaving the Transform's brace and bracket legitimately unclosed.
    const scan = scanVrml(withHeader(`Transform { children [\n${'Shape {}\n'.repeat(170000)}`));

    expect(scan.truncated).toBe(true);
    expect(scan.warnings).not.toContain(FINDING_MALFORMED_VRML);
  });

  it('still reports genuinely unbalanced structure that was read to the end', () => {
    const scan = scanVrml(withHeader('Transform { children [ Shape {}'));

    expect(scan.truncated).toBe(false);
    expect(scan.warnings).toContain(FINDING_MALFORMED_VRML);
  });
});
