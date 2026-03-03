const fs = require('fs');

function analyzeGLB(path) {
    const buf = fs.readFileSync(path);
    const jsonLen = buf.readUInt32LE(12);
    const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));

    console.log('=== ' + path + ' ===');
    console.log('Meshes:', json.meshes ? json.meshes.length : 0);

    if (json.accessors) {
        for (let i = 0; i < json.accessors.length; i++) {
            const acc = json.accessors[i];
            if (acc.type === 'VEC3' && acc.min && acc.max) {
                let isPos = false;
                if (json.meshes) {
                    for (const m of json.meshes) {
                        if (m.primitives) {
                            for (const p of m.primitives) {
                                if (p.attributes && p.attributes.POSITION === i) {
                                    isPos = true;
                                }
                            }
                        }
                    }
                }
                if (isPos) {
                    const h = acc.max[1] - acc.min[1];
                    const w = acc.max[0] - acc.min[0];
                    const d = acc.max[2] - acc.min[2];
                    console.log(`  POSITION[${i}]: min=[${acc.min.map(v=>v.toFixed(1))}] max=[${acc.max.map(v=>v.toFixed(1))}]`);
                    console.log(`    Width(X)=${w.toFixed(1)} Height(Y)=${h.toFixed(1)} Depth(Z)=${d.toFixed(1)}`);
                }
            }
        }
    }

    const rootIdx = json.scenes[0].nodes[0];
    const root = json.nodes[rootIdx];
    console.log('  Root:', root.name, 'scale:', JSON.stringify(root.scale));

    for (let i = 0; i < json.nodes.length; i++) {
        const node = json.nodes[i];
        if (node.mesh !== undefined) {
            console.log(`  MeshNode[${i}] "${node.name}": rot=${JSON.stringify(node.rotation)} scale=${JSON.stringify(node.scale)}`);
        }
    }
}

analyzeGLB('RogueV3.glb');
console.log('');
analyzeGLB('Boss1_3k.glb');
