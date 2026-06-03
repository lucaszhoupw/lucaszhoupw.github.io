#!/usr/bin/env python3
"""
Build the self-hosted Chinese serif (Noto Serif SC) used by the site.

Two-stage loading keeps things fast for mainland-China visitors (who
cannot reach Google Fonts) while guaranteeing full coverage:

  * NotoSerifSC-common-400/700.woff2 — a small subset of ~3,800 everyday
    characters (GB2312 level-1 + whatever the site currently uses). This
    loads quickly and covers virtually all text.
  * NotoSerifSC.woff2 — the full variable font (all ~31k glyphs), fetched
    only when a rare character outside the common set appears.

Run after adding new Chinese text if you want new (less common) characters
folded into the fast subset:  python3 fonts/build-fonts.py
Requires: pip install fonttools brotli
"""
import os
import urllib.request
from fontTools import ttLib
from fontTools.subset import Subsetter, Options
from fontTools.varLib.instancer import instantiateVariableFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(HERE, "_NotoSerifSC-source.ttf")  # not committed (see .gitignore)
SRC_URL = ("https://github.com/google/fonts/raw/main/"
           "ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf")
HTML_FILES = ["index.html", "gallery.html"]
EXTRA = set("，。、；：？！（）【】「」『』《》—…·“”‘’～％　")


def common_charset():
    chars = set()
    for hi in range(0xB0, 0xD8):              # GB2312 level-1 hanzi
        for lo in range(0xA1, 0xFF):
            try:
                chars.add(bytes([hi, lo]).decode("gb2312"))
            except Exception:
                pass
    for fn in HTML_FILES:                      # whatever the site uses today
        with open(os.path.join(ROOT, fn), encoding="utf-8") as f:
            for ch in f.read():
                if ord(ch) > 0x2000 or 0x00B7 <= ord(ch) <= 0x00FF:
                    chars.add(ch)
    return chars | EXTRA


def save_subset(text, weight, out):
    f = ttLib.TTFont(SRC)
    opt = Options(); opt.layout_features = ["*"]; opt.name_IDs = ["*"]
    ss = Subsetter(options=opt); ss.populate(text=text); ss.subset(f)
    instantiateVariableFont(f, {"wght": weight}, inplace=True)
    f.flavor = "woff2"; f.save(os.path.join(HERE, out))
    print(f"  {out}: {os.path.getsize(os.path.join(HERE, out)) / 1024:.0f} KB")


def save_full(out):
    f = ttLib.TTFont(SRC)
    f.flavor = "woff2"; f.save(os.path.join(HERE, out))
    print(f"  {out}: {os.path.getsize(os.path.join(HERE, out)) / 1024 / 1024:.1f} MB")


def main():
    if not os.path.exists(SRC):
        print("Downloading Noto Serif SC variable font ...")
        urllib.request.urlretrieve(SRC_URL, SRC)
    text = "".join(sorted(common_charset()))
    print(f"Common charset: {len(text)} glyphs")
    save_subset(text, 400, "NotoSerifSC-common-400.woff2")
    save_subset(text, 700, "NotoSerifSC-common-700.woff2")
    save_full("NotoSerifSC.woff2")
    print("done")


if __name__ == "__main__":
    main()
