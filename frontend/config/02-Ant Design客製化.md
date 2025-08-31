# Ant Design客製化配置

## 動態變體更換原則

### 核心概念
- **變體可替換性**: 所有組件變體可在不破壞架構的情況下隨時更換
- **統一抽象層**: 建立組件抽象層隔離變體差異  
- **動畫兼容性**: 確保GSAP動畫在變體更換後仍正常運作
- **樣式一致性**: 玻璃態效果和色彩系統在不同變體間保持一致

### 實現策略
- 使用CSS類別覆蓋而非硬編碼樣式
- 保持組件props API的一致性
- 動畫綁定到穩定的選擇器而非特定變體類別

## 組件客製化架構

### 目錄結構
```
styles/antd-components/
├── FloatButton.module.scss
├── Button.module.scss
├── Icon.module.scss
├── Typography.module.scss
├── Divider.module.scss
├── Flex.module.scss
├── Layout.module.scss
├── Space.module.scss
├── Splitter.module.scss
├── Breadcrumb.module.scss
├── Dropdown.module.scss
├── Menu.module.scss
├── Pagination.module.scss
├── Steps.module.scss
├── Tabs.module.scss
├── AutoComplete.module.scss
├── Cascader.module.scss
├── Checkbox.module.scss
├── ColorPicker.module.scss
├── DatePicker.module.scss
├── Form.module.scss
├── Input.module.scss
├── InputNumber.module.scss
├── Mentions.module.scss
├── Radio.module.scss
├── Rate.module.scss
├── Select.module.scss
├── Slider.module.scss
├── Switch.module.scss
├── TimePicker.module.scss
├── Transfer.module.scss
├── TreeSelect.module.scss
├── Upload.module.scss
├── Badge.module.scss
├── Card.module.scss
├── Carousel.module.scss
├── Collapse.module.scss
├── Descriptions.module.scss
├── Empty.module.scss
├── Image.module.scss
├── List.module.scss
├── Popover.module.scss
├── QRCode.module.scss
├── Segmented.module.scss
├── Statistic.module.scss
├── Table.module.scss
├── Tag.module.scss
├── Timeline.module.scss
├── Tour.module.scss
├── Tree.module.scss
├── Alert.module.scss
├── Drawer.module.scss
├── Modal.module.scss
├── Notification.module.scss
├── Popconfirm.module.scss
├── Progress.module.scss
├── Result.module.scss
├── Spin.module.scss
└── Affix.module.scss
```

## 核心組件客製化

### Button.module.scss
```scss
/* 基礎按鈕樣式 */
:global(.ant-btn) {
  font-family: var(--font-zh);
  border-radius: 8px;
  font-weight: 400;
  transition: var(--theme-transition);
}

/* 主要按鈕 */
:global(.ant-btn-primary) {
  background-color: var(--bg-selected) !important;
  border-color: var(--bg-selected) !important;
  color: var(--text-primary) !important;
  
  &:hover {
    background-color: var(--bg-hover) !important;
    border-color: var(--bg-hover) !important;
  }
  
  &:active {
    background-color: var(--bg-selected) !important;
    border-color: var(--bg-selected) !important;
  }
}

/* 預設按鈕 */
:global(.ant-btn-default) {
  background-color: var(--bg-component) !important;
  border-color: var(--bg-hover) !important;
  color: var(--text-primary) !important;
  
  &:hover {
    background-color: var(--bg-hover) !important;
    border-color: var(--bg-selected) !important;
    color: var(--text-primary) !important;
  }
}

/* 幽靈按鈕 */
:global(.ant-btn-ghost) {
  background-color: transparent !important;
  border-color: var(--bg-selected) !important;
  color: var(--bg-selected) !important;
  
  &:hover {
    background-color: var(--bg-selected) !important;
    color: var(--text-primary) !important;
  }
}
```

### Form.module.scss
```scss
/* 表單標籤 */
:global(.ant-form-item-label) {
  font-family: var(--font-zh);
  color: var(--text-primary) !important;
  
  > label {
    color: var(--text-primary) !important;
  }
}

/* 必填標記 */
:global(.ant-form-item-required) {
  &::before {
    color: #ff4d4f !important;
  }
}

/* 表單驗證錯誤 */
:global(.ant-form-item-has-error) {
  :global(.ant-input) {
    border-color: #ff4d4f !important;
  }
}

/* 表單幫助文字 */
:global(.ant-form-item-explain-error) {
  color: #ff4d4f !important;
  font-family: var(--font-zh);
}
```

### Input.module.scss
```scss
/* 基礎輸入框 */
:global(.ant-input) {
  background-color: var(--bg-component) !important;
  border-color: var(--bg-hover) !important;
  color: var(--text-primary) !important;
  border-radius: 8px;
  font-family: var(--font-zh);
  
  &::placeholder {
    color: var(--text-primary) !important;
    opacity: 0.6;
  }
  
  &:hover {
    border-color: var(--bg-selected) !important;
  }
  
  &:focus {
    border-color: var(--bg-selected) !important;
    box-shadow: 0 0 0 2px rgba(166, 101, 86, 0.2) !important;
  }
}

/* 輸入框群組 */
:global(.ant-input-group-addon) {
  background-color: var(--bg-component) !important;
  border-color: var(--bg-hover) !important;
  color: var(--text-primary) !important;
}

/* 文字區域 */
:global(.ant-input) {
  &[data-testid="textarea"] {
    min-height: 100px;
    resize: vertical;
  }
}
```

### Card.module.scss
```scss
/* 基礎卡片 */
:global(.ant-card) {
  background-color: var(--bg-component) !important;
  border-color: var(--bg-hover) !important;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  [data-theme="dark"] & {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}

/* 卡片標題 */
:global(.ant-card-head-title) {
  color: var(--text-primary) !important;
  font-family: var(--font-zh);
  font-weight: 500;
}

/* 卡片內容 */
:global(.ant-card-body) {
  color: var(--text-primary) !important;
}

/* 卡片懸停效果 */
:global(.ant-card-hoverable) {
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
    transition: all 0.3s ease;
    
    [data-theme="dark"] & {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }
  }
}
```

### Table.module.scss
```scss
/* 表格頭部 */
:global(.ant-table-thead) > tr > th {
  background-color: var(--bg-component) !important;
  color: var(--text-primary) !important;
  border-bottom-color: var(--bg-hover) !important;
  font-family: var(--font-zh);
  font-weight: 500;
}

/* 表格內容 */
:global(.ant-table-tbody) > tr > td {
  border-bottom-color: var(--bg-hover) !important;
  color: var(--text-primary) !important;
}

/* 表格行懸停 */
:global(.ant-table-tbody) > tr:hover > td {
  background-color: var(--bg-component) !important;
}

/* 表格容器 */
:global(.ant-table) {
  background-color: var(--bg-page) !important;
}

/* 分頁器 */
:global(.ant-pagination) {
  :global(.ant-pagination-item) {
    background-color: var(--bg-component) !important;
    border-color: var(--bg-hover) !important;
    
    a {
      color: var(--text-primary) !important;
    }
    
    &:hover {
      border-color: var(--bg-selected) !important;
    }
  }
  
  :global(.ant-pagination-item-active) {
    background-color: var(--bg-selected) !important;
    border-color: var(--bg-selected) !important;
    
    a {
      color: var(--text-primary) !important;
    }
  }
}
```

### Modal.module.scss
```scss
/* 模態框蒙版 */
:global(.ant-modal-mask) {
  background-color: rgba(0, 0, 0, 0.6) !important;
}

/* 模態框內容 */
:global(.ant-modal-content) {
  background-color: var(--bg-page) !important;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* 模態框標題 */
:global(.ant-modal-title) {
  color: var(--text-primary) !important;
  font-family: var(--font-zh);
  font-weight: 500;
}

/* 模態框主體 */
:global(.ant-modal-body) {
  color: var(--text-primary) !important;
}

/* 關閉按鈕 */
:global(.ant-modal-close) {
  color: var(--text-primary) !important;
  
  &:hover {
    background-color: var(--bg-hover) !important;
  }
}
```

### Menu.module.scss
```scss
/* 選單容器 */
:global(.ant-menu) {
  background-color: var(--bg-component) !important;
  border-color: var(--bg-hover) !important;
  
  &:not(.ant-menu-horizontal) {
    border-right-color: var(--bg-hover) !important;
  }
}

/* 選單項目 */
:global(.ant-menu-item) {
  color: var(--text-primary) !important;
  font-family: var(--font-zh);
  
  &:hover {
    background-color: var(--bg-hover) !important;
    color: var(--text-primary) !important;
  }
  
  &.ant-menu-item-selected {
    background-color: var(--bg-selected) !important;
    color: var(--text-primary) !important;
  }
}

/* 子選單標題 */
:global(.ant-menu-submenu-title) {
  color: var(--text-primary) !important;
  
  &:hover {
    background-color: var(--bg-hover) !important;
    color: var(--text-primary) !important;
  }
}
```

## 全局主題覆蓋

### antd-theme.scss
```scss
/* 引入所有組件客製化 */
@import './FloatButton.module.scss';
@import './Button.module.scss';
@import './Icon.module.scss';
@import './Typography.module.scss';
@import './Divider.module.scss';
@import './Flex.module.scss';
@import './Layout.module.scss';
@import './Space.module.scss';
@import './Splitter.module.scss';
@import './Breadcrumb.module.scss';
@import './Dropdown.module.scss';
@import './Menu.module.scss';
@import './Pagination.module.scss';
@import './Steps.module.scss';
@import './Tabs.module.scss';
@import './AutoComplete.module.scss';
@import './Cascader.module.scss';
@import './Checkbox.module.scss';
@import './ColorPicker.module.scss';
@import './DatePicker.module.scss';
@import './Form.module.scss';
@import './Input.module.scss';
@import './InputNumber.module.scss';
@import './Mentions.module.scss';
@import './Radio.module.scss';
@import './Rate.module.scss';
@import './Select.module.scss';
@import './Slider.module.scss';
@import './Switch.module.scss';
@import './TimePicker.module.scss';
@import './Transfer.module.scss';
@import './TreeSelect.module.scss';
@import './Upload.module.scss';
@import './Badge.module.scss';
@import './Card.module.scss';
@import './Carousel.module.scss';
@import './Collapse.module.scss';
@import './Descriptions.module.scss';
@import './Empty.module.scss';
@import './Image.module.scss';
@import './List.module.scss';
@import './Popover.module.scss';
@import './QRCode.module.scss';
@import './Segmented.module.scss';
@import './Statistic.module.scss';
@import './Table.module.scss';
@import './Tag.module.scss';
@import './Timeline.module.scss';
@import './Tour.module.scss';
@import './Tree.module.scss';
@import './Alert.module.scss';
@import './Drawer.module.scss';
@import './Modal.module.scss';
@import './Notification.module.scss';
@import './Popconfirm.module.scss';
@import './Progress.module.scss';
@import './Result.module.scss';
@import './Spin.module.scss';
@import './Affix.module.scss';

/* 全局字體設定 */
:global(.ant-typography) {
  font-family: var(--font-zh) !important;
  color: var(--text-primary) !important;
}

/* 禁用組件時的統一樣式 */
:global(.ant-btn-disabled),
:global(.ant-input-disabled),
:global(.ant-select-disabled) {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}
```

## 響應式設計適配

### 移動端優化
```scss
/* 移動端按鈕調整 */
@media (max-width: 768px) {
  :global(.ant-btn) {
    min-width: 44px;
    min-height: 44px;
    font-size: 16px;
  }
  
  :global(.ant-input) {
    font-size: 16px; /* 防止iOS縮放 */
    min-height: 44px;
  }
  
  :global(.ant-modal) {
    margin: 16px;
    max-width: calc(100vw - 32px);
  }
}
```