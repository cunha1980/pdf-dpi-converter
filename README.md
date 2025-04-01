# 📄 Conversor de PDFs para 300 DPI com Compressão (Node.js)

Este projeto é um script em Node.js que:
- Extrai imagens de PDFs
- Redimensiona e converte as imagens para JPEG com 300 DPI e compressão configurável
- Reconstrói um novo PDF a partir dessas imagens
- Opcionalmente, comprime o PDF gerado com Ghostscript
- Suporta varredura em subpastas, limpeza automática e controle de reprocessamento
- Mostra o progresso completo no terminal (modo verbose)

---

## 🔧 Requisitos

- [Node.js](https://nodejs.org/) (versão 14+)
- [poppler-utils](https://poppler.freedesktop.org/) (para `pdfimages`)
- [ImageMagick](https://imagemagick.org/) (para `convert`)
- [Ghostscript](https://www.ghostscript.com/) (opcional, para compressão)

### Ubuntu / WSL:
```bash
sudo apt update
sudo apt install poppler-utils imagemagick ghostscript
```

Instale dependências do projeto:
```bash
npm install fs-extra execa
```

---

## ▶️ Como usar

### Comando básico:
```bash
node analisarPdfs.js <caminho-da-pasta>
```

### Argumentos opcionais:
| Argumento         | Função                                                                 |
|-------------------|-------------------------------------------------------------------------|
| `--compress`       | Aplica compressão com Ghostscript para gerar `_300dpi_comprimido.pdf`   |
| `--no-skip`        | Força reprocessar PDFs já tratados (`_300dpi.pdf`, `_300dpi_comprimido.pdf`) |
| `--recursive`      | Percorre todas as subpastas procurando PDFs                            |
| `--cleanup`        | Remove pastas de imagens e o arquivo `_300dpi.pdf` após compressão        |
| `--quality <n>`    | Define a qualidade do JPEG gerado (padrão: 80)                          |

### Exemplos:

📄 Processar PDFs em uma pasta:
```bash
node analisarPdfs.js ./meus_pdfs
```

📦 Processar e comprimir:
```bash
node analisarPdfs.js ./meus_pdfs --compress
```

🧹 Processar, comprimir e limpar arquivos intermediários:
```bash
node analisarPdfs.js ./meus_pdfs --compress --cleanup
```

🔁 Processar tudo inclusive subpastas:
```bash
node analisarPdfs.js ./meus_pdfs --recursive --compress --cleanup
```

🔧 Definir qualidade personalizada (ex: 75%):
```bash
node analisarPdfs.js ./meus_pdfs --quality 75 --compress
```

---

## 📂 Saída esperada

- Um novo PDF com sufixo `_300dpi.pdf`
- Se `--compress` for usado, gera também `_300dpi_comprimido.pdf`
- Arquivo `relatorio_geral.txt` na pasta raiz informando o status de cada PDF
- Pastas `_imagens/` com arquivos `.jpg` intermediários (opcionalmente apagadas com `--cleanup`)

---

## 🔍 Modo Verbose
Durante a execução, o script exibe no terminal:
- Nome do PDF sendo processado
- Imagens extraídas e convertidas
- Status da criação e compressão dos PDFs
- Ações de limpeza se ativadas

Isso ajuda a acompanhar o que está sendo feito em tempo real.

---

## 📜 Licença
MIT

