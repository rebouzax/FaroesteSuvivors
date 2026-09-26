"""Crop the generated frontier contact sheets into compact menu artwork."""
import json
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw

ROOT=Path(__file__).resolve().parents[2]
SHEETS=json.loads((ROOT/"src/assets/frontier-art-sources.json").read_text(encoding="utf8"))
heroes=["jacinto","aurora","gaspar","celeste","severino","amara"]
stages=["salt-flats-art","ember-foundry-art","moon-monastery-art","thorn-garden-art","last-dawn-art"]
report=[]
for group,names,destination,portrait in [("heroes",heroes,"portraits",True),("stages",stages,"stages",False)]:
    source=Image.open(SHEETS[group]["file"]).convert("RGB")
    cols,rows=3,2; sw,sh=source.size; cellw,cellh=sw/cols,sh/rows
    for index,name in enumerate(names):
        x=index%cols;y=index//cols
        left=round(x*cellw)+4;top=round(y*cellh)+4
        right=round((x+1)*cellw)-4;bottom=round((y+1)*cellh)-4
        tile=source.crop((left,top,right,bottom))
        if portrait:
            canvas=Image.new("RGB",(tile.width,round(tile.width*1.5)))
            background=tile.resize(canvas.size).filter(ImageFilter.GaussianBlur(28))
            canvas.paste(background)
            offset=(canvas.height-tile.height)//2
            mask=Image.new("L",tile.size,255);draw=ImageDraw.Draw(mask)
            for y in range(36):
                alpha=round(255*(y/35))
                draw.line((0,y,tile.width,y),fill=alpha)
                draw.line((0,tile.height-1-y,tile.width,tile.height-1-y),fill=alpha)
            canvas.paste(tile,(0,offset),mask)
            output=ROOT/f"src/assets/{destination}/{name}-frontier.webp"
            canvas.save(output,"WEBP",quality=84,method=6)
        else:
            output=ROOT/f"src/assets/{destination}/{name}.webp"
            tile.thumbnail((768,512),Image.Resampling.LANCZOS)
            tile.save(output,"WEBP",quality=84,method=6)
        report.append({"file":str(output.relative_to(ROOT)),"bytes":output.stat().st_size,"dimensions":Image.open(output).size})
print(json.dumps(report,ensure_ascii=False,indent=2))
