import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch all pets
  const pets = await base44.asServiceRole.entities.CustomPet.list('-created_date', 200);
  const petsWithLore = pets.filter(p => p.lore && p.lore.trim().length > 0);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;

  // ── COVER PAGE ──
  doc.setFillColor(15, 10, 40);
  doc.rect(0, 0, W, H, 'F');

  // Stars
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H * 0.6;
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y, 0.4, 'F');
  }

  // Title
  doc.setTextColor(255, 220, 50);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('THE CHRONICLES OF', W / 2, 55, { align: 'center' });
  doc.setFontSize(22);
  doc.setTextColor(120, 200, 255);
  doc.text('THE $1 WIFI INCIDENT', W / 2, 68, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(180, 180, 255);
  doc.text('A Complete Lore Collection', W / 2, 80, { align: 'center' });

  // Divider
  doc.setDrawColor(255, 220, 50);
  doc.setLineWidth(0.8);
  doc.line(30, 86, W - 30, 86);

  // Origin Story
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 230);
  const origin = [
    'In the beginning, there was a student with exactly $1.00.',
    'The school wifi cost $1.01.',
    '',
    'That one missing cent triggered a catastrophic digital glitch,',
    'ripping open a pocket dimension where pets were born',
    'from corrupted data, lost homework, and forgotten Kahoot answers.',
    '',
    'This is their story.'
  ];
  let oy = 100;
  origin.forEach(line => {
    doc.text(line, W / 2, oy, { align: 'center' });
    oy += line === '' ? 4 : 7;
  });

  // Pet count
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 200);
  doc.text(`${petsWithLore.length} Pets Documented`, W / 2, H - 25, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, W / 2, H - 18, { align: 'center' });

  // ── PET LORE PAGES ──
  const rarityColors = {
    common:    [140, 140, 140],
    uncommon:  [80, 180, 80],
    rare:      [80, 120, 220],
    epic:      [160, 80, 220],
    legendary: [220, 160, 30],
  };

  const rarityBg = {
    common:    [245, 245, 248],
    uncommon:  [240, 250, 240],
    rare:      [240, 243, 255],
    epic:      [248, 240, 255],
    legendary: [255, 250, 235],
  };

  for (let i = 0; i < petsWithLore.length; i++) {
    const pet = petsWithLore[i];
    doc.addPage();

    const [r, g, b] = rarityBg[pet.rarity] || [245, 245, 248];
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, W, H, 'F');

    // Top color bar
    const [cr, cg, cb] = rarityColors[pet.rarity] || [140, 140, 140];
    doc.setFillColor(cr, cg, cb);
    doc.rect(0, 0, W, 8, 'F');

    // Pet number
    doc.setFontSize(8);
    doc.setTextColor(cr, cg, cb);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${String(i + 1).padStart(3, '0')}  ·  ${(pet.rarity || 'common').toUpperCase()}`, 15, 20);

    // Pet name
    doc.setFontSize(26);
    doc.setTextColor(30, 30, 50);
    doc.text(pet.name || 'Unknown Pet', 15, 33);

    // Divider line
    doc.setDrawColor(cr, cg, cb);
    doc.setLineWidth(0.5);
    doc.line(15, 36, W - 15, 36);

    // Pet image panel (left side) — prefer loreImageUrl, fallback to imageUrl
    const imgX = 15;
    const imgY = 42;
    const imgSize = 70;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(cr, cg, cb);
    doc.setLineWidth(1.5);
    doc.roundedRect(imgX, imgY, imgSize, imgSize, 4, 4, 'FD');

    const displayImageUrl = pet.loreImageUrl || pet.imageUrl;

    if (displayImageUrl && !displayImageUrl.startsWith('data:image/svg')) {
      try {
        // Fetch and convert to base64 for reliable jsPDF embedding
        const imgResp = await fetch(displayImageUrl);
        const imgBuf = await imgResp.arrayBuffer();
        const imgBase64 = btoa(String.fromCharCode(...new Uint8Array(imgBuf)));
        const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
        const imgFormat = contentType.includes('png') ? 'PNG' : 'JPEG';
        const dataUrl = `data:${contentType};base64,${imgBase64}`;
        doc.addImage(dataUrl, imgFormat, imgX + 3, imgY + 3, imgSize - 6, imgSize - 6);
        // "Lore Art" badge if using lore image
        if (pet.loreImageUrl) {
          doc.setFillColor(cr, cg, cb);
          doc.setFontSize(6);
          doc.setTextColor(255, 255, 255);
          doc.roundedRect(imgX + 2, imgY + imgSize - 10, 22, 8, 2, 2, 'F');
          doc.text('LORE ART', imgX + 13, imgY + imgSize - 5, { align: 'center' });
        }
      } catch (e) {
        doc.setFontSize(36);
        doc.text(pet.emoji || '🐾', imgX + imgSize / 2, imgY + imgSize / 2 + 8, { align: 'center' });
      }
    } else if (pet.emoji) {
      doc.setFontSize(36);
      doc.text(pet.emoji, imgX + imgSize / 2, imgY + imgSize / 2 + 8, { align: 'center' });
    }

    // Stats panel (right of image)
    const statsX = imgX + imgSize + 8;
    const statsW = W - statsX - 15;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.5);
    doc.roundedRect(statsX, imgY, statsW, imgSize, 4, 4, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 120);
    doc.setFont('helvetica', 'normal');

    const stats = [
      ['RARITY', (pet.rarity || '—').toUpperCase()],
      ['XP TO UNLOCK', pet.xpRequired != null ? String(pet.xpRequired) : '—'],
      ['TYPE', pet.isGiftOnly ? 'GIFT ONLY' : 'EARNABLE'],
      ['ORIGIN', 'WIFI INCIDENT'],
    ];

    stats.forEach(([label, val], si) => {
      const sy = imgY + 10 + si * 16;
      doc.setTextColor(140, 140, 160);
      doc.setFont('helvetica', 'normal');
      doc.text(label, statsX + 6, sy);
      doc.setTextColor(30, 30, 60);
      doc.setFont('helvetica', 'bold');
      doc.text(val, statsX + 6, sy + 6);
    });

    // Description box
    if (pet.description) {
      const descY = imgY + imgSize + 8;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 220, 230);
      doc.roundedRect(15, descY, W - 30, 18, 3, 3, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 100);
      doc.setFont('helvetica', 'italic');
      const descLines = doc.splitTextToSize(`"${pet.description}"`, W - 40);
      doc.text(descLines.slice(0, 2), 20, descY + 7);
    }

    // Lore section
    const loreY = (pet.description ? imgY + imgSize + 32 : imgY + imgSize + 10);
    doc.setFontSize(10);
    doc.setTextColor(cr, cg, cb);
    doc.setFont('helvetica', 'bold');
    doc.text('📖  LORE', 15, loreY);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(cr, cg, cb);
    doc.setLineWidth(1);
    const loreBoxH = H - loreY - 20;
    doc.roundedRect(15, loreY + 4, W - 30, loreBoxH, 4, 4, 'FD');

    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 50);
    doc.setFont('helvetica', 'normal');
    const loreLines = doc.splitTextToSize(pet.lore, W - 50);
    doc.text(loreLines, 22, loreY + 13);

    // Page footer
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 200);
    doc.text(`The Chronicles of the $1 Wifi Incident  ·  Page ${i + 2}`, W / 2, H - 8, { align: 'center' });
  }

  // ── NO LORE PAGE (if some pets have no lore) ──
  const noLorePets = pets.filter(p => !p.lore || !p.lore.trim());
  if (noLorePets.length > 0) {
    doc.addPage();
    doc.setFillColor(245, 245, 248);
    doc.rect(0, 0, W, H, 'F');
    doc.setFontSize(16);
    doc.setTextColor(100, 100, 130);
    doc.setFont('helvetica', 'bold');
    doc.text('Pets Awaiting Their Story', W / 2, 30, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 220);
    doc.line(30, 34, W - 30, 34);

    doc.setFontSize(9);
    doc.setTextColor(130, 130, 160);
    doc.setFont('helvetica', 'italic');
    doc.text('These pets have yet to have their lore generated by the Lore Master.', W / 2, 42, { align: 'center' });

    let ny = 55;
    noLorePets.forEach((p, idx) => {
      if (ny > H - 20) return;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 100);
      doc.setFontSize(9);
      doc.text(`${idx + 1}. ${p.name}  (${p.rarity || 'common'})`, 20, ny);
      ny += 8;
    });
  }

  const pdfBytes = doc.output('arraybuffer');

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="pet-lore-comic.pdf"',
    },
  });
});