// Silhueta animada do chupacabra; coordenadas relativas ao cenário 1600 × 1000.
export function drawMenuChupacabra(ctx, time) {
  ctx.save();
  ctx.translate(1045, 832);
  ctx.scale(1.35, 1.35);
  ctx.fillStyle = "#65443655";
  ctx.beginPath(); ctx.ellipse(0, 4, 66, 13, 0, 0, Math.PI * 2); ctx.fill();
  const shape = (points, color) => {
    ctx.fillStyle = color; ctx.beginPath();
    points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.closePath(); ctx.fill();
  };
  // Espinhos, dorso arqueado, patas traseiras dobradas e cauda.
  shape([[27,-38],[68,-55],[58,-51],[76,-49],[45,-24],[30,-18]],"#403c34");
  shape([[-27,-28],[-56,-45],[-54,-69],[-45,-56],[-38,-75],[-32,-62],[-24,-85],[-17,-66],[-6,-79],[2,-57],[15,-62],[35,-34],[27,-10],[-18,-7]],"#47443a");
  shape([[-19,-28],[-35,-15],[-36,-2],[-16,0],[-3,-22]],"#38382f");
  shape([[10,-27],[38,-22],[40,-3],[23,0],[16,-15]],"#393a31");
  shape([[-18,-65],[-32,-73],[-48,-76],[-43,-99],[-28,-107],[-9,-102],[3,-79],[10,-64]],"#47473a");
  shape([[-42,-91],[-48,-119],[-29,-106]],"#393c34");
  shape([[-23,-98],[-13,-121],[-11,-95]],"#393c34");
  // O maxilar oscila ao roer o osso; animação interrompida em movimento reduzido.
  const chew = Math.sin(time * 8) * 2.5;
  shape([[-46,-77],[-70,-84],[-65,-70],[-41,-69]],"#343830");
  shape([[-66,-74],[-54,-70+chew],[-43,-70],[-49,-64+chew],[-62,-65+chew]],"#282d2b");
  ctx.strokeStyle = "#e4d1a5"; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-81,-69); ctx.lineTo(-54,-68); ctx.stroke();
  for (const x of [-84,-78]) { ctx.beginPath(); ctx.arc(x,-69,3.5,0,Math.PI*2); ctx.fillStyle="#e4d1a5"; ctx.fill(); }
  shape([[-52,-91],[-46,-93],[-48,-88]],"#ecac50");
  ctx.restore();
}
