import json, os
# Gera:
#  - index.html  -> app de produção (vai para o GitHub). NÃO contém perguntas nem gabarito.
#  - demo.html   -> modo demonstração com o banco de perguntas embutido (NÃO publicar).
src = 'src/'
logica = open('functions/logica.js').read()
placa = open('functions/placa.js').read()
garagem = open('functions/garagem.js').read()
partes = ''.join(open(src + f).read() + '\n' for f in ['a0-logo.js', 'a0b-fotos.js', 'a1-base.js', 'a2-dados.js', 'a3-telas.js', 'a4-jogos.js', 'a4b-motor.js', 'a4c-real3d.js', 'a4d-placa.js', 'a4e-garagem.js', 'a4f-musica.js', 'a5-adm.js', 'a6-acoes.js'])
head = open(src + 'head.html').read()

def montar(banco, modelos=None):
    h = head
    h += '<script>var MODELOS_EMBUTIDOS = ' + json.dumps(modelos or {}) + ';</script>\n'
    h += '<script>\n/* ===== LOGICA (idêntica a functions/logica.js) ===== */\n' + logica + '\n</script>\n'
    h += '<script>\n/* ===== PLACA (idêntico a functions/placa.js) ===== */\n' + placa + '\n</script>\n'
    h += '<script>\n/* ===== GARAGEM (idêntico a functions/garagem.js) ===== */\n' + garagem + '\n</script>\n'
    h += '<script>\nvar BANCO_INICIAL = ' + json.dumps(banco, ensure_ascii=False) + ';\n</script>\n'
    h += '<script>\n' + partes + '</script>\n</body>\n</html>\n'
    return h

open('index.html', 'w').write(montar([]))
print('index.html', os.path.getsize('index.html') // 1024, 'KB (sem perguntas)')
if os.path.exists(src + 'banco-perguntas.json'):
    banco = json.load(open(src + 'banco-perguntas.json'))
    B = [[q['ID'], q['Tema'], q['Dificuldade'], q['Pergunta'], [q['A'], q['B'], q['C'], q['D']], 'ABCD'.index(q['Correta']), q['Observação'] or ''] for q in banco]
    import base64, glob
    mods = {os.path.basename(f)[:-4]: 'data:model/gltf-binary;base64,' + base64.b64encode(open(f, 'rb').read()).decode() for f in glob.glob('assets/carros/*.glb')}
    d = montar(B, mods).replace('var DEMO = !FIREBASE_CONFIG.apiKey;', 'var DEMO = true;  // demonstração sempre local')
    assert 'var DEMO = true;' in d
    open('demo.html', 'w').write(d)
    print('demo.html', os.path.getsize('demo.html') // 1024, 'KB', len(B), 'perguntas')
