"""Stitches the demo test recordings into one captioned video.
Run with: npm run demo:tests  (Linux, macOS or WSL; needs ffmpeg, Python 3 and Pillow)."""
import json, os, subprocess

BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, "demo-results", "build")
os.makedirs(WORK, exist_ok=True)

RESULTS = json.load(open(os.path.join(ROOT, "demo-results/results.json")))
tests = []
def walk(suite, path):
    for sub in suite.get("suites", []):
        walk(sub, path + [sub["title"]])
    for spec in suite.get("specs", []):
        for t in spec["tests"]:
            for res in t["results"]:
                vids = [x["path"] for x in res.get("attachments", []) if x.get("name") == "video"]
                name = " › ".join([q for q in path if q and not q.endswith(".ts")] + [spec["title"]])
                tests.append((name, res["status"], res["duration"], vids[:1]))
for top in RESULTS["suites"]:
    walk(top, [top["title"]])
by_name = {t[0]: t for t in tests}

picks = [
    ("Home page › has the correct title and main heading", "Home page loads with the right title and heading"),
    ("Home page › hero call-to-action scrolls to the contact form", "\"Start your free trial\" button scrolls to the form"),
    ('Service tabs › clicking "Mobile apps" shows Mobile app testing', "Clicking \"Mobile apps\" shows mobile testing"),
    ('Service tabs › clicking "APIs" shows API testing', "Clicking \"APIs\" shows API testing"),
    ("Service tabs › arrow keys move between tabs", "Keyboard arrow keys move between tabs"),
    ("FAQ answers expand and collapse", "FAQ answers open and close"),
    ("Pricing › home page shows the free trial and the $10 test pack", "Pricing shows the free trial and the $10 test pack"),
    ("Pricing › test pack rules are explained and linked", "Link opens \"How test packs work\" on the pricing page"),
    ("Our work section › the nav links to the section", "Menu link jumps to the \"Our work\" section"),
    ("Contact form › shows an error when required fields are empty", "Empty form shows a helpful error"),
    ("Contact form › sends the enquiry and shows a success message", "Enquiry is sent and a success message appears"),
    ("Contact form › shows a helpful message when the form service is down", "Form service down: visitor sees what to do"),
    ("Pay page › with payment links configured, buttons open the payment pages", "Payment buttons open Razorpay and PayPal"),
    ("Pricing › every page states the same price", "Every page shows the same price: $10 for 20 test cases"),
]
passed = sum(1 for t in tests if t[1] == "passed")
failed = sum(1 for t in tests if t[1] == "failed")


def txt(name, text):
    p = f"{WORK}/{name}.txt"
    open(p, "w").write(text)
    return p


def run(args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error"] + args, check=True)


def last_content_time(path):
    """Seconds into the clip of the last frame that isn't blank (Playwright can record the page closing)."""
    from PIL import Image, ImageStat
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                         "-of", "csv=p=0", path]).decode().strip())
    t = dur - 0.05
    while t > 0.3:
        tmp = f"{WORK}/probe.png"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.2f}", "-i", path,
                        "-frames:v", "1", "-vf", "scale=160:-1", tmp], check=True)
        if max(ImageStat.Stat(Image.open(tmp).convert("L")).stddev) > 12:
            return t
        t -= 0.1
    return dur


ENC = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "25", "-crf", "22", "-preset", "medium"]


def card(name, lines, seconds=3.2):
    """lines: list of (text, font, size, y, color)"""
    filters = []
    for i, (t, font, size, y, color) in enumerate(lines):
        f = txt(f"{name}_{i}", t)
        filters.append(f"drawtext=fontfile={font}:textfile={f}:fontsize={size}:fontcolor={color}:x=(w-text_w)/2:y={y}")
    out = f"{WORK}/{name}.mp4"
    run(["-f", "lavfi", "-i", f"color=c=0x14233A:s=1280x720:d={seconds}:r=25", "-vf", ",".join(filters)] + ENC + [out])
    return out


parts = [card("intro", [
    ("TestersHub", BOLD, 64, 220, "white"),
    ("Automated test suite running in Chromium", REG, 34, 320, "0xFFD84D"),
    ("Playwright  •  real browser  •  slowed down so you can follow", REG, 24, 390, "0xC5CFDD"),
    ("testershub.in", REG, 24, 560, "0xC5CFDD"),
], 3.6)]

n = len(picks)
for k, (name, label) in enumerate(picks, 1):
    title, status, dur, vids = by_name[name]
    assert status == "passed" and vids, title
    cap = txt(f"cap{k}", f"Test {k} of {n}:  {label}")
    ok = txt(f"ok{k}", "✓  PASSED")
    src = os.path.join(ROOT, vids[0]) if not vids[0].startswith("/") else vids[0]
    end = last_content_time(src)
    vf = (
        f"trim=0:{end:.2f},setpts=PTS-STARTPTS,"
        "scale=-2:656,pad=1280:720:(ow-iw)/2:0:color=0x14233A,"
        "tpad=stop_mode=clone:stop_duration=1.3,"
        "drawbox=x=0:y=ih-64:w=iw:h=64:color=0x14233A@0.92:t=fill,"
        f"drawtext=fontfile={BOLD}:textfile={cap}:fontsize=24:fontcolor=white:x=28:y=h-45,"
        f"drawbox=x=iw-210:y=ih-54:w=186:h=44:color=0x1D7A4E:t=fill:enable='gte(t,{min(dur/1000, end):.2f})',"
        f"drawtext=fontfile={BOLD}:textfile={ok}:fontsize=22:fontcolor=white:x=w-192:y=h-44:enable='gte(t,{min(dur/1000, end):.2f})'"
    )
    out = f"{WORK}/clip{k:02d}.mp4"
    run(["-i", src, "-vf", vf, "-an"] + ENC + [out])
    parts.append(out)

parts.append(card("outro", [
    (f"{passed} tests passed   •   {failed} failed", BOLD, 50, 230, "white"),
    ("Every change to testershub.in is tested like this before it goes live", REG, 26, 320, "0xC5CFDD"),
    ("Want this for your app?  Start your free trial at testershub.in", BOLD, 28, 470, "0xFFD84D"),
], 4.2))

lst = f"{WORK}/list.txt"
open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
final = os.path.join(ROOT, "demo-results", "testershub-tests-demo.mp4")
run(["-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", final])
print(final, passed, failed)
