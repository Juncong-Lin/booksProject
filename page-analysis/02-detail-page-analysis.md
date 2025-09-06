# Detail Page (Product Detail) Analysis

## Page Type

**Data Generation Page** - Individual product viewing and purchase decision page

## Navigation Structure

### 1. Main Header (shared-header.html)

- **Logo Link**: "Qili Mobile Logo" → Links to `index.html` (home)
- **Data Management Link**: "Data Management" → Links to `analytics-management.html`
- **Search Bar**: Input field with search button and search icon
- **Dashboard Link**: "Dashboard" → Links to `dashboard.html`
- **Cart Link**: Shows cart icon, quantity, and "Cart" text → Links to `checkout.html`

### 2. Sub Header Navigation (shared-subheader.html)

- **Browse All Books**: Return to main catalog
- **Category Links**: Fiction, Non-Fiction, Children & Young Adult, etc.
- **Submenu Navigation**: Category-specific subcategories

### 3. Breadcrumb Navigation

- **Breadcrumb Trail**: `.breadcrumb-nav` - Shows navigation path to current product

### 4. Right Panel (shared-right-panel.html)

**Fixed Position Buttons:**

- **Go Top Button**: "GO Top" with up arrow icon
- **Phone Button**: Contact information display
- **WeChat Button**: WeChat QR code popup
- **Contact Button**: Scroll to footer contact section

### 5. Footer (shared-footer.html)

**Standard footer navigation and contact information**

## Main Content Area

### Product Information Section

#### 1. Product Title

- **Product Title Container**: `.product-title-container`
- **Product Name**: `.js-product-name` - Dynamically loaded product title

#### 2. Product Images Section

- **Main Product Image**: `.js-product-image` - Large product display
- **Image Thumbnails**: `.js-product-thumbnails` - Multiple product views
- **Thumbnail Navigation**:
  - **Left Arrow**: `.js-thumbnail-arrow-left` - Previous image
  - **Right Arrow**: `.js-thumbnail-arrow-right` - Next image

#### 3. Product Details Section

- **Price Container**:
  - **Current Price**: `.js-product-price`
  - **Original Price**: `.js-product-original-price` (if discounted)
- **Rating Display**:
  - **Rating Stars**: `.js-product-rating`
  - **Rating Count**: `.js-product-rating-count`
- **Product Tags**: `.js-product-tags` - Category/feature labels

#### 4. Purchase Controls

- **Quantity Selector**: Dropdown with options 1-10
- **Add to Cart Button**: `.js-add-to-cart` - Primary purchase action
- **Added Confirmation**: `.js-added-message` - Success feedback with checkmark

### Product Information Tabs

#### 1. Tab Headers

- **Product Details Tab**: Active by default

#### 2. Tab Content Sections

- **Product Description**: `.js-product-description`
- **Product Details Content**: `.js-product-details-content`
- **Product Compatibility Section**: "Product Description" section
- **Product Specifications Section**: "Product Information" table

#### 3. Product Information Table

- **UPC**: `.js-product-upc`
- **Product Type**: `.js-product-type`
- **Price (excl. tax)**: `.js-product-price-excl-tax`
- **Price (incl. tax)**: `.js-product-price-incl-tax`
- **Tax**: `.js-product-tax`
- **Availability**: `.js-product-availability`
- **Number of Reviews**: `.js-product-review-count`

## Interactive Elements

### Image Interaction

- **Main Image View**: Large product image display
- **Thumbnail Navigation**: Scroll through product images
- **Image Magnification**: Possible zoom functionality

### Purchase Workflow

- **Quantity Selection**: Choose number of items
- **Add to Cart**: Primary conversion action
- **Immediate Feedback**: Success message display

### Content Navigation

- **Tab Switching**: Navigate between product information sections
- **Scroll Navigation**: Navigate through detailed content

## Technical Features

### Document Parsing Libraries

- **Mammoth.js**: Word document processing
- **PDF.js**: PDF document viewing
- **Document Viewer**: `.document-viewer.css` - Custom document display
- **Image Magnifier**: `.image-magnifier.css` - Image zoom functionality

### Scripts and Analytics

- **Analytics Tracking**: User behavior on product pages
- **Image Loading**: Optimized image display
- **Document Processing**: Handle various file formats
- **URL Management**: Product-specific URL handling

## Data Generation Aspects

This page generates the following user data:

- **Product Views**: Individual product page visits
- **Image Interactions**: Thumbnail clicks, image views
- **Time on Product**: Engagement duration
- **Add to Cart Events**: Purchase intent tracking
- **Quantity Selections**: Purchase behavior patterns
- **Price Interactions**: Price sensitivity analysis
- **Tab Navigation**: Content consumption patterns
- **Document Downloads**: Resource engagement
- **Scroll Depth**: Product information consumption
- **Exit Points**: Where users leave the product page
- **Conversion Tracking**: From view to cart addition

---

## 🎯 Recommended Data Analysis System for Detail Page

### Product Conversion Optimization Analytics System

**Purpose**: Maximize product page conversion rates through detailed interaction analysis

**Key Click Events to Track**:

- **Add to Cart Button Clicks**: Primary conversion measurement
- **Quantity Selector Clicks**: Purchase intent and volume analysis
- **Image Thumbnail Clicks**: Visual engagement and interest
- **Tab Navigation Clicks**: Information consumption patterns
- **Breadcrumb Clicks**: Navigation and exit behavior
- **Related Product Clicks**: Cross-selling opportunities
- **Magnifier/Zoom Clicks**: Detailed product examination

**System Prompt Design**:

```
Create a Product Page Conversion Analytics Engine that:

1. CONVERSION FUNNEL ANALYSIS:
   - Track click sequence: Page Load → Image Views → Info Tabs → Add to Cart
   - Measure time-to-conversion from first page load to cart addition
   - Analyze abandonment points where users exit without converting
   - Calculate conversion rates by traffic source and user segment

2. PRODUCT ENGAGEMENT OPTIMIZATION:
   - Monitor image interaction patterns (main image vs. thumbnails)
   - Track tab clicking behavior to optimize information architecture
   - Measure scroll depth correlation with conversion rates
   - Analyze quantity selection patterns for inventory planning

3. PRICE SENSITIVITY ANALYSIS:
   - Track time spent viewing price information vs. conversion
   - Monitor price comparison behavior (original vs. sale price)
   - Analyze exit rates immediately after price viewing
   - A/B test different price display formats and measure click impact

4. CONTENT EFFECTIVENESS MEASUREMENT:
   - Track which product information tabs drive highest conversions
   - Measure document download rates and subsequent purchase behavior
   - Analyze product description engagement vs. conversion correlation
   - Monitor review/rating interaction and conversion impact

5. CROSS-SELL OPTIMIZATION:
   - Track related product click rates and conversion funnels
   - Measure "customers also bought" section effectiveness
   - Analyze category navigation from product pages
   - Calculate revenue impact of cross-sell recommendations

6. MOBILE VS DESKTOP BEHAVIOR:
   - Compare image interaction patterns across devices
   - Analyze touch vs. click behavior differences
   - Measure mobile-specific conversion barriers
   - Optimize mobile product page layout based on click heatmaps

OUTPUT DASHBOARDS:
   - Real-time conversion funnel with drop-off points
   - Product page heatmap showing click density areas
   - A/B testing results for page element optimization
   - Individual product performance rankings with conversion metrics
   - Cross-sell effectiveness matrix
   - Mobile optimization recommendations based on interaction data
```

**Implementation Priority**: Critical - This page directly drives revenue conversion
