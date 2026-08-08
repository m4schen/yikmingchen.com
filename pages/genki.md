---
title: "Genki — Personal Health Records / Genki - 个人健康档案"
date: 2026-07-01
tags:
  - project
  - genki
  - health
  - ios
---

## Genki — Personal Health Records

**2026.07 — Present**

- Independent iOS app built with Swift / SwiftUI focused on on-device privacy-first medical record management.
- Uses Apple's Vision framework to OCR medical reports and diagnosis slips while ensuring Protected Health Information (PHI) never leaves the device; performs automatic cleaning of unstructured medical data and aggregates multi-hospital records into a structured personal archive.
- Integrates with Apple HealthKit and employs regex-based heuristics to parse prescription entities (medication name / dosage), enabling seamless write-back of medication data to native iOS modules.
- Uses async/await to optimize OCR asynchronous queues and avoid main-thread blocking during image processing.

---

## Genki - 个人健康档案

**2026.07 — 至今**

- 独立开发基于 Swift / SwiftUI 的纯端侧医疗应用，聚焦隐私优先的个人健康档案管理。
- 使用 Apple 的 Vision Framework 对诊断单与检查报告进行 OCR 识别，确保敏感健康数据（PHI）零云端交互；实现对非结构化医疗数据的自动清洗，并将多院记录结构化归档为个人档案。
- 接入 Apple HealthKit，结合正则表达式启发式解析处方实体（药名 / 剂量），实现用药信息向 iOS 原生模块的无缝写入。
- 采用 async/await 优化 OCR 的异步队列，在图像处理时避免主线程阻塞，提升体验与稳定性。

- 备注：该项目为私人项目，后续计划商业化发布。

---

If you'd like this listed on the public Projects page, I can add a short entry or link to it from the main Projects index.
