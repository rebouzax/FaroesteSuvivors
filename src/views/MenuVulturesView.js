// Objetos do menu usam o mesmo espaço lógico 1600 × 1000 do deserto.
export function drawMenuVultures(ctx, time) {
  const polygon = (points, fill) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const bird = (x, y, scale, peck) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    // Pés finos e garras repousam no objeto abaixo.
    ctx.strokeStyle = "#514137";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (const dx of [-12, 12]) {
      ctx.beginPath(); ctx.moveTo(dx, -13); ctx.lineTo(dx, 7);
      ctx.lineTo(dx - 7, 10); ctx.moveTo(dx, 7); ctx.lineTo(dx + 6, 11); ctx.stroke();
    }
    polygon([[-31,-55],[-56,-85],[-50,-45],[-39,-22],[-8,-15],[32,-22],[44,-55],[26,-82],[-3,-87]],"#39352e");
    polygon([[-23,-64],[-43,-93],[-39,-41],[-12,-20],[21,-28],[33,-70],[23,-46],[7,-39]],"#534a3e");
    polygon([[19,-69],[29,-102],[39,-129],[42,-143],[48,-144],[48,-122],[38,-89],[34,-59]],"#6c5843");
    ctx.save();
    ctx.translate(43, -136);
    ctx.rotate(peck);
    ctx.fillStyle = "#675e4d";
    ctx.beginPath(); ctx.ellipse(0,0,15,17,-0.25,0,Math.PI*2); ctx.fill();
    polygon([[9,2],[29,5],[19,18],[12,13]],"#d1ae69");
    ctx.fillStyle = "#f3bc5e";
    ctx.beginPath(); ctx.arc(6,-4,2.4,0,Math.PI*2); ctx.fill();
    ctx.restore();
    polygon([[-28,-22],[-23,-4],[-36,-15]],"#443b31");
    ctx.restore();
  };
  ctx.save();
  // Cerca seca próxima ao primeiro urubu.
  ctx.strokeStyle = "#715036";
  ctx.lineCap = "round";
  ctx.lineWidth = 14;
  ctx.beginPath(); ctx.moveTo(1025, 889); ctx.lineTo(1030, 728);
  ctx.moveTo(1275, 890); ctx.lineTo(1268, 722); ctx.stroke();
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(985, 785); ctx.lineTo(1320, 780);
  ctx.moveTo(990, 852); ctx.lineTo(1320, 847); ctx.stroke();
  ctx.strokeStyle = "#b98457";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(1036, 730); ctx.lineTo(1033, 887);
  ctx.moveTo(1275, 730); ctx.lineTo(1280, 881); ctx.stroke();
  bird(1152, 777, 0.82, Math.sin(time * 1.3) * 0.05);

  // Crânio de gado com chifres, órbitas e cavidade nasal.
  ctx.fillStyle = "#583f3050";
  ctx.beginPath(); ctx.ellipse(892, 931, 100, 15, 0, 0, Math.PI * 2); ctx.fill();
  polygon([[831,864],[813,832],[795,829],[806,857],[833,881]],"#e6c997");
  polygon([[935,865],[954,830],[973,828],[962,861],[944,882]],"#e6c997");
  polygon([[838,857],[872,846],[912,852],[939,873],[935,900],[917,912],[904,930],[867,930],[852,908],[836,898]],"#eedab0");
  polygon([[856,877],[878,866],[873,893],[861,892]],"#765c45");
  polygon([[905,868],[925,877],[919,892],[906,893]],"#765c45");
  polygon([[878,911],[892,906],[902,914],[893,922],[879,922]],"#765c45");
  bird(877, 856, 0.64, Math.sin(time * 3.5) * 0.13 + 0.07);
  ctx.restore();
}
