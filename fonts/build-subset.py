#!/usr/bin/env python3
"""
Rebuild the self-hosted Chinese serif subset (Noto Serif SC).

Why: visitors in mainland China cannot reach Google Fonts, so the song
typeface is bundled in the repo instead. Only the Chinese glyphs that
actually appear on the site are included, which keeps the files tiny
(~55 KB per weight). Latin text uses Georgia, so Latin glyphs are not
needed here.

When to run: after adding new Chinese text to index.html / gallery.html,
so any new characters get included. Requires `pip install fonttools brotli`.

    python3 fonts/build-subset.py
"""
import os
import urllib.request
from fontTools import ttLib
from fontTools.subset import Subsetter, Options
from fontTools.varLib.instancer import instantiateVariableFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(HERE, "_NotoSerifSC-source.ttf")  # variable font, not committed
SRC_URL = ("https://github.com/google/fonts/raw/main/"
           "ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf")
HTML_FILES = ["index.html", "gallery.html"]
WEIGHTS = {400: "NotoSerifSC-subset-400.woff2",
           700: "NotoSerifSC-subset-700.woff2"}
# Common Chinese punctuation kept as a safety net.
EXTRA = set("，。、；：？！（）【】「」『』《》—…·“”‘’～％")


def collect_chars():
    chars = set(EXTRA)
    for fn in HTML_FILES:
        with open(os.path.join(ROOT, fn), encoding="utf-8") as f:
            for ch in f.read():
                if ord(ch) > 0x2000 or 0x00B7 <= ord(ch) <= 0x00FF:
                    chars.add(ch)
    return "".join(sorted(chars))


def main():
    if not os.path.exists(SRC):
        print("Downloading Noto Serif SC variable font ...")
        urllib.request.urlretrieve(SRC_URL, SRC)
    text = collect_chars()
    print(f"Unique glyphs: {len(set(text))}")
    for weight, out in WEIGHTS.items():
        f = ttLib.TTFont(SRC)
        opt = Options()
        opt.layout_features = ["*"]
        opt.name_IDs = ["*"]
        ss = Subsetter(options=opt)
        ss.populate(text=text)
        ss.subset(f)
        instantiateVariableFont(f, {"wght": weight}, inplace=True)
        f.flavor = "woff2"
        path = os.path.join(HERE, out)
        f.save(path)
        print(f"  {out}: {os.path.getsize(path) / 1024:.1f} KB")
    print("done")


if __name__ == "__main__":
    main()
