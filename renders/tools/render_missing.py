#!/usr/bin/env python3
"""Render every catalog image job that is still missing or still a draft card.

Reads catalog/export/image-jobs.json and catalog/images/.drafts.json, writes the open jobs to a batch file and runs
renders/render.mjs on it in chunks (one Chromium per chunk), so an interrupted run can simply be started again: jobs
that already have a real render are skipped.

Usage: python3 renders/tools/render_missing.py [--size 1200] [--samples 24] [--chunk 40] [--only model1,model2] [--list]
"""
import hashlib
import json
import os
import subprocess
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
JOBS = os.path.join(REPO, "catalog", "export", "image-jobs.json")
DRAFTS = os.path.join(REPO, "catalog", "images", ".drafts.json")
BATCH_DIR = os.path.join(REPO, "renders", "batches")


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def sha256(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def open_jobs():
    jobs = json.load(open(JOBS))["jobs"]
    drafts = json.load(open(DRAFTS)).get("files", {}) if os.path.exists(DRAFTS) else {}
    out = []
    for job in jobs:
        spec = job.get("spec")
        if not spec or not spec.get("model"):
            continue  # scenes without a render spec are made elsewhere
        path = os.path.join(REPO, job.get("out") or os.path.join("catalog", "images", job["file"]))
        if os.path.exists(path) and not (job["file"] in drafts and sha256(path) == drafts[job["file"]]):
            continue
        out.append((job, path))
    return out


def main():
    size, samples, chunk = int(arg("--size", 1200)), int(arg("--samples", 24)), int(arg("--chunk", 40))
    only = set(filter(None, arg("--only", "").split(",")))
    todo = [(j, p) for j, p in open_jobs() if not only or j["spec"]["model"] in only]
    print(f"open jobs: {len(todo)}")
    if "--list" in sys.argv:
        for j, _ in todo:
            print(j["spec"]["model"], j["file"])
        return
    os.makedirs(BATCH_DIR, exist_ok=True)
    failed = 0
    for n in range(0, len(todo), chunk):
        part = todo[n:n + chunk]
        batch = os.path.join(BATCH_DIR, f"missing-{n // chunk + 1}.jsonl")
        with open(batch, "w") as fh:
            for job, path in part:
                spec = dict(job["spec"])
                spec.update(size=size, samples=samples, out=os.path.relpath(path, BATCH_DIR))
                fh.write(json.dumps(spec) + "\n")
        print(f"chunk {n // chunk + 1}: {len(part)} jobs", flush=True)
        r = subprocess.run(["node", os.path.join(REPO, "renders", "render.mjs"), "--batch", batch,
                            "--size", str(size), "--samples", str(samples)], cwd=REPO)
        failed += r.returncode != 0
    # drop drafts that are now real renders
    subprocess.run([sys.executable, os.path.join(REPO, "catalog", "tools", "draft_images.py"), "--registry-only"], cwd=REPO)
    print(f"done; chunks with failures: {failed}; still open: {len(open_jobs())}")


if __name__ == "__main__":
    main()
