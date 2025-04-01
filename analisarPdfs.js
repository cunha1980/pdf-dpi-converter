const fs = require('fs-extra');
const path = require('path');
const execa = require('execa');

async function coletarPDFs(diretorio, recursive, ignorarProcessados) {
  let pdfs = [];
  const arquivos = await fs.readdir(diretorio, { withFileTypes: true });
  for (const item of arquivos) {
    const caminho = path.join(diretorio, item.name);
    if (item.isDirectory() && recursive) {
      const internos = await coletarPDFs(caminho, recursive, ignorarProcessados);
      pdfs.push(...internos);
    } else if (
      item.isFile() &&
      item.name.toLowerCase().endsWith('.pdf') &&
      (!ignorarProcessados ||
        (!item.name.endsWith('_300dpi.pdf') &&
         !item.name.endsWith('_300dpi_comprimido.pdf')))
    ) {
      pdfs.push(caminho);
    }
  }
  return pdfs;
}

async function processarPDF(pdfPath, usarCompressao, quality, limparIntermediarios, relatorioPath) {
  const pastaBase = path.dirname(pdfPath);
  const nomeBase = path.basename(pdfPath, '.pdf');
  const pastaImagens = path.join(pastaBase, `${nomeBase}_imagens`);
  await fs.ensureDir(pastaImagens);

  console.log(`\n📄 Processando: ${pdfPath}`);
  await fs.appendFile(relatorioPath, `\n--- ${pdfPath} ---\n`);

  try {
    console.log('📥 Extraindo imagens...');
    await execa('pdfimages', ['-png', pdfPath, path.join(pastaImagens, 'img')]);
    console.log('✅ Imagens extraídas.');
    await fs.appendFile(relatorioPath, '✅ Imagens extraídas.\n');
  } catch (err) {
    console.error(`❌ Erro ao extrair imagens: ${err.message}`);
    await fs.appendFile(relatorioPath, `❌ Erro ao extrair imagens: ${err.message}\n`);
    return;
  }

  const imagens = await fs.readdir(pastaImagens);
  const imagensJPG = [];

  for (const img of imagens.filter(i => i.endsWith('.png'))) {
    const imgPath = path.join(pastaImagens, img);
    const novoNome = img.replace('.png', '_300dpi.jpg');
    const novoPath = path.join(pastaImagens, novoNome);

    try {
      console.log(`🖼️ Convertendo ${img} → JPEG (${quality}%)...`);
      await execa('convert', [imgPath, '-resize', '50%', '-resample', '300', '-quality', `${quality}`, novoPath]);
      imagensJPG.push(novoPath);
      console.log(`✅ ${novoNome} gerado`);
      await fs.appendFile(relatorioPath, `🖼️ ${img} ➜ ${novoNome} [JPEG ${quality}% + 300 DPI]\n`);
    } catch (err) {
      console.error(`❌ Erro ao converter ${img}: ${err.message}`);
      await fs.appendFile(relatorioPath, `❌ Erro ao converter ${img}: ${err.message}\n`);
    }
  }

  if (imagensJPG.length > 0) {
    const pdfDestino = path.join(pastaBase, `${nomeBase}_300dpi.pdf`);
    try {
      console.log('🧾 Montando PDF com imagens convertidas...');
      await execa('convert', [...imagensJPG, pdfDestino]);
      console.log(`📄 PDF criado: ${pdfDestino}`);
      await fs.appendFile(relatorioPath, `📄 PDF criado: ${path.basename(pdfDestino)}\n`);

      if (usarCompressao) {
        const pdfComprimido = path.join(pastaBase, `${nomeBase}_300dpi_comprimido.pdf`);
        try {
          console.log('📦 Comprimindo PDF com Ghostscript...');
          await execa('gs', [
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            '-dPDFSETTINGS=/ebook',
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            `-sOutputFile=${pdfComprimido}`,
            pdfDestino
          ]);
          console.log(`✅ PDF comprimido: ${pdfComprimido}`);
          await fs.appendFile(relatorioPath, `📦 PDF comprimido: ${path.basename(pdfComprimido)}\n`);

          if (limparIntermediarios) {
            console.log('🧹 Apagando PDF intermediário...');
            await fs.remove(pdfDestino);
          }
        } catch (err) {
          console.error(`❌ Erro ao comprimir PDF: ${err.message}`);
          await fs.appendFile(relatorioPath, `❌ Erro ao comprimir PDF: ${err.message}\n`);
        }
      }

      if (limparIntermediarios) {
        console.log('🧹 Removendo pasta de imagens...');
        await fs.remove(pastaImagens);
      }

    } catch (err) {
      console.error(`❌ Erro ao criar PDF: ${err.message}`);
      await fs.appendFile(relatorioPath, `❌ Erro ao criar PDF: ${err.message}\n`);
    }
  } else {
    console.log(`⚠️ Nenhuma imagem convertida para ${pdfPath}`);
    await fs.appendFile(relatorioPath, `⚠️ Nenhuma imagem convertida para ${pdfPath}\n`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const pastaAlvo = args.find(arg => !arg.startsWith('--'));
  const usarCompressao = args.includes('--compress');
  const ignorarProcessados = !args.includes('--no-skip');
  const recursive = args.includes('--recursive');
  const limparIntermediarios = args.includes('--cleanup');

  const qualidadeIndex = args.findIndex(arg => arg === '--quality');
  const quality = (qualidadeIndex !== -1 && args[qualidadeIndex + 1])
    ? parseInt(args[qualidadeIndex + 1])
    : 80;

  if (!pastaAlvo) {
    console.error('❗ Use: node analisarPdfs.js <caminho> [opções]');
    return;
  }

  const relatorioPath = path.join(pastaAlvo, 'relatorio_geral.txt');
  await fs.writeFile(relatorioPath, `📄 RELATÓRIO GERAL DE CONVERSÃO (JPEG ${quality}%)\n\n`);

  const pdfs = await coletarPDFs(pastaAlvo, recursive, ignorarProcessados);
  if (pdfs.length === 0) {
    console.log('Nenhum PDF encontrado.');
    return;
  }

  for (const pdf of pdfs) {
    await processarPDF(pdf, usarCompressao, quality, limparIntermediarios, relatorioPath);
  }

  console.log(`✅ Processamento concluído. Relatório: ${relatorioPath}`);
}

main();
