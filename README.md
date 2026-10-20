# CaçaPalavra

Jogo casual de adivinhação semântica em português brasileiro. Faça palpites, acompanhe a posição no ranking e encontre a palavra secreta sem limite de tentativas.

## Executar

Requer Node.js 20 ou superior. O projeto não tem dependências externas.

```powershell
node server.js
```

Abra `http://127.0.0.1:4173` no navegador. Para executar os testes:

```powershell
node --test
```

## Escopo atual

Esta primeira versão é um MVP jogável com um vocabulário pequeno e relações semânticas curadas em `src/catalog.js`. A classificação é determinística e permanece no servidor; a palavra secreta só é enviada depois do acerto. O conjunto não representa um dicionário completo nem um modelo semântico de produção. Aumentar o vocabulário exige curadoria linguística e uma fonte/modelo com licença verificada.

As partidas e os palpites ficam em memória no processo do servidor (até 1.000 sessões, com retenção máxima de 30 dias); o navegador guarda o identificador e o histórico local para restaurar uma partida enquanto o servidor estiver ativo. Ao atingir o limite, as sessões mais antigas podem ser removidas. Persistência durável, expansão do vocabulário e pipeline editorial são etapas futuras descritas em [SPECS.md](./SPECS.md).

Os três mockups de interface estão em [prototypes/](./prototypes/), com uma página de apresentação em `prototypes/index.html`.