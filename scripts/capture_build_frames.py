import time
import os
from playwright.sync_api import sync_playwright

os.makedirs("qa_frames", exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1600, "height": 950})
    page = context.new_page()

    print("Navigating to http://localhost:3000...")
    page.goto("http://localhost:3000", wait_until="networkidle")

    # Frame A: Initial State (Container tracing active, stage empty, build button visible)
    time.sleep(1.0)
    page.screenshot(path="qa_frames/frame_A_initial.png")
    print("Captured Frame A: Initial State")

    # Click BUILD THE EXPERIENCE
    print("Clicking #build-btn...")
    page.click("#build-btn")

    # Frame B: Global Activation (0.2s after click)
    time.sleep(0.2)
    page.screenshot(path="qa_frames/frame_B_activation.png")
    print("Captured Frame B: Global Activation")

    # Frame C: Particle Collection / Donors in flight (0.8s)
    time.sleep(0.6)
    page.screenshot(path="qa_frames/frame_C_collection.png")
    print("Captured Frame C: Particle Collection")

    # Frame D: Chassis Construction (1.6s)
    time.sleep(0.8)
    page.screenshot(path="qa_frames/frame_D_chassis.png")
    print("Captured Frame D: Chassis Construction")

    # Frame E: Screen & Interface Containers (2.8s)
    time.sleep(1.2)
    page.screenshot(path="qa_frames/frame_E_interface.png")
    print("Captured Frame E: Internal Interface")

    # Frame F: MAD Emblem Activation & Shock (3.6s)
    time.sleep(0.8)
    page.screenshot(path="qa_frames/frame_F_emblem_shock.png")
    print("Captured Frame F: Logo Activation & Shock")

    # Frame G: Materialization (4.4s)
    time.sleep(0.8)
    page.screenshot(path="qa_frames/frame_G_materialization.png")
    print("Captured Frame G: Materialization")

    # Frame H: Final State (5.4s)
    time.sleep(1.0)
    page.screenshot(path="qa_frames/frame_H_final_live.png")
    print("Captured Frame H: Final State Live")

    browser.close()
    print("Visual QA complete! All 8 frames saved to qa_frames/")
