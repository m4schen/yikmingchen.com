---
title: Projects - Yiming Chen
display: Projects
description: List of projects that I am proud of
wrapperClass: 'text-center'
art: dots
projects:
  Current Focus:
    - name: "Genki — Personal Health Records / Genki - 个人健康档案"
      desc: "<p>Independent iOS app built with Swift/SwiftUI for privacy-first personal health archives. Uses Apple's Vision framework to OCR medical reports on-device (PHI never leaves the device); integrates with Apple HealthKit and parses prescription entities for seamless native write-back. Private project (planned for commercial release).</p><p>独立开发基于 Swift / SwiftUI 的纯端侧医疗应用，使用 Vision OCR 在设备端处理敏感健康数据（PHI 不出设备）；接入 Apple HealthKit，解析处方实体并支持写回 iOS 原生模块。私人项目，后续计划商业化发布。</p>"
      excerpt: "On-device health archive / 端侧健康档案（Vision OCR + HealthKit）"
      icon: "i-ph-heartbeat"
      link: "/genki/"

---

<!-- @layout-full-width -->
<ListProjects :projects="frontmatter.projects" />
