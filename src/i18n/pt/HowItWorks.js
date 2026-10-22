// Textos de src/components/HowItWorks.svelte, incluindo os nós dos diagramas (por id, como em
// src/lib/how-it-works.js, que guarda as posições, as setas e as ligações à documentação).
import { DEFAULT_KDF_PARAMS } from "../../lib/crypto.js";

const { memoryKiB, iterations, parallelism } = DEFAULT_KDF_PARAMS;

export default {
  title: "Como funciona",
  close: "Fechar",
  levelOfDetail: "Nível de detalhe",
  simple: {
    name: "Simplificado",
    legend: {
      browser: "Só no seu dispositivo",
      server: "Guardado no servidor",
      step: "Bloquear ou desbloquear",
    },
    nodes: {
      password: {
        title: "A sua palavra-passe mestra",
        note: "A única palavra-passe de que se lembra. Nunca sai do seu dispositivo e ninguém a pode repor por si, por isso guarde-a num local seguro.",
      },
      salt: {
        title: "Um ingrediente aleatório",
        note: "Criado uma vez na configuração e guardado com o seu cofre (o nome técnico é “salt”). Não é secreto. Torna a sua chave única, mesmo que outra pessoa escolha a mesma palavra-passe.",
      },
      makeKey: {
        title: "Criar uma chave, devagar",
        note: "A sua palavra-passe e o ingrediente são misturados numa chave. Isto é lento de propósito: quase não nota, mas tentar milhões de palavras-passe adivinhadas demoraria demasiado tempo.",
      },
      masterKey: {
        title: "A sua chave mestra",
        note: "Só existe enquanto o cofre está desbloqueado. Bloquear, ou fechar o separador, deita-a fora.",
      },
      vaultKeys: {
        title: "Uma chave para cada cofre",
        note: "Cada cofre tem a sua própria chave aleatória, e a sua chave mestra tranca-as a todas. Alterar a palavra-passe mestra só volta a trancar estas chaves.",
      },
      logins: {
        title: "As suas entradas",
        note: "Utilizadores, palavras-passe, sites e notas, tal como os escreve.",
      },
      lock: {
        title: "Trancar",
        note: "As suas entradas são baralhadas com a chave do cofre no seu dispositivo, antes de qualquer envio. Baralhadas, parecem letras ao acaso.",
      },
      server: {
        title: "O servidor",
        note: "Guarda apenas dados baralhados. Quem copiar o ficheiro inteiro continua sem conseguir ler uma única palavra-passe sem a sua palavra-passe mestra.",
      },
      unlock: {
        title: "Destrancar",
        note: "Quando desbloqueia, o seu dispositivo transfere os dados baralhados e desbaralha-os ele próprio, com as suas chaves.",
      },
      onScreen: {
        title: "No seu ecrã",
        note: "As suas entradas, de novo legíveis, só no seu dispositivo e só enquanto está desbloqueado.",
      },
    },
  },
  technical: {
    name: "Técnico",
    legend: {
      browser: "Só na memória do browser",
      server: "Guardado na base de dados",
      step: "Algoritmo",
    },
    nodes: {
      password: {
        title: "Palavra-passe mestra",
        note: "Escrita por si para desbloquear. Nunca é guardada nem enviada para o servidor.",
      },
      random: {
        title: "Gerador aleatório",
        note: "crypto.getRandomValues: os números aleatórios criptograficamente seguros do browser.",
      },
      vaultName: {
        title: "Nome do cofre",
        note: "O nome que dá a um cofre, como Trabalho.",
      },
      login: {
        title: "Entrada",
        note: "Nome, utilizador, palavra-passe, site e notas, juntos num único objeto JSON.",
      },
      salt: {
        title: "Salt",
        note: "16 bytes aleatórios, guardados em key_derivation.salt. Não é secreto. Faz com que a mesma palavra-passe dê uma chave diferente em cada instalação, para que atacantes não reutilizem tentativas pré-calculadas. É criado um novo quando altera a palavra-passe.",
      },
      kdfParams: {
        title: "Definições do Argon2id",
        note: `${memoryKiB / 1024} MiB de memória, ${iterations} passagens, ${parallelism} via. Guardadas em key_derivation.kdf_params, para poderem ser reforçadas mais tarde sem estragar cofres antigos.`,
      },
      vaultKey: {
        title: "Chave do cofre",
        note: "Uma chave aleatória de 256 bits, uma por cofre. Encripta o nome e as entradas desse cofre. Alterar a palavra-passe mestra só volta a embrulhar esta chave; nenhuma entrada é encriptada de novo.",
      },
      nonce: {
        title: "Nonce",
        note: "12 bytes aleatórios, novos em cada encriptação, guardados antes do texto cifrado. Os mesmos dados nunca são encriptados da mesma forma duas vezes.",
      },
      context: {
        title: "Contexto",
        note: "Indica a linha a que os dados pertencem, como item:<id>. Não é secreto nem é guardado, mas tem de coincidir para desencriptar, por isso o texto cifrado não pode ser movido para outra linha.",
      },
      argon2: {
        title: "Argon2id",
        note: "Um hash lento de propósito e exigente em memória. Transforma palavra-passe + salt numa chave, e faz com que cada tentativa de adivinhar a sua palavra-passe custe o mesmo tempo e memória.",
      },
      masterKey: {
        title: "Chave mestra",
        note: "A chave de 256 bits que o Argon2id produz. Fica só em memória enquanto está desbloqueado. A sua única função é trancar e destrancar as chaves dos cofres.",
      },
      wrap: {
        title: "Embrulhar: AES-256-GCM",
        note: "Encripta a chave do cofre com a chave mestra. O GCM também acrescenta uma etiqueta que deteta qualquer alteração aos dados.",
      },
      encrypt: {
        title: "Encriptar: AES-256-GCM",
        note: "Encripta os nomes dos cofres e as entradas com a chave do cofre. Incluído em todos os browsers (WebCrypto).",
      },
      verifier: {
        title: "key_derivation.verifier",
        note: "Um texto fixo encriptado com a chave mestra. Ao desbloquear, tenta-se desencriptá-lo: se funcionar, a palavra-passe está certa.",
      },
      wrappedKey: {
        title: "vaults.wrapped_key",
        note: "A chave do cofre, encriptada, guardada como base64(nonce + texto cifrado).",
      },
      nameEnc: {
        title: "vaults.name_enc",
        note: "O nome do cofre, encriptado.",
      },
      dataEnc: {
        title: "items.data_enc",
        note: "A entrada, encriptada. É tudo o que o servidor alguma vez vê dela.",
      },
      unwrap: {
        title: "Desembrulhar: AES-256-GCM",
        note: "Ao desbloquear, a chave mestra desencripta cada chave de cofre. Falha se a palavra-passe estiver errada ou se os dados tiverem sido alterados.",
      },
      decrypt: {
        title: "Desencriptar: AES-256-GCM",
        note: "A chave do cofre desencripta os nomes e as entradas. A etiqueta GCM é verificada primeiro, por isso dados alterados falham em vez de mostrarem lixo.",
      },
      onScreen: {
        title: "No seu ecrã",
        note: "Os seus cofres e entradas, legíveis só enquanto está desbloqueado. Bloquear ou fechar o separador esquece-os, e a todas as chaves.",
      },
    },
  },
};
