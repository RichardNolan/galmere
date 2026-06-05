export type MockProduct = {
  id: string
  name: string
  sku: string
  summary: string
}

export type MockBrand = {
  id: string
  name: string
  products: MockProduct[]
}

export const mockBrands: MockBrand[] = [
  {
    id: 'brand-alpha',
    name: 'Brand Alpha',
    products: [
      {
        id: 'alpha-tomato-soup',
        name: 'Tomato Soup',
        sku: 'ALP-TS-001',
        summary: 'Classic tomato soup with basil and black pepper.',
      },
      {
        id: 'alpha-garden-pesto',
        name: 'Garden Pesto',
        sku: 'ALP-GP-002',
        summary: 'Fresh basil pesto with pine nuts and pecorino.',
      },
      {
        id: 'alpha-roasted-dip',
        name: 'Roasted Pepper Dip',
        sku: 'ALP-RD-003',
        summary: 'Roasted red pepper dip with smoked paprika.',
      },
    ],
  },
  {
    id: 'brand-bravo',
    name: 'Brand Bravo',
    products: [
      {
        id: 'bravo-coconut-curry',
        name: 'Coconut Curry Sauce',
        sku: 'BRV-CC-101',
        summary: 'Mild yellow curry sauce with coconut cream.',
      },
      {
        id: 'bravo-noodle-kit',
        name: 'Satay Noodle Kit',
        sku: 'BRV-SN-102',
        summary: 'Peanut satay noodle kit with dried garnish sachet.',
      },
      {
        id: 'bravo-lime-dressing',
        name: 'Chilli Lime Dressing',
        sku: 'BRV-CL-103',
        summary: 'Sharp citrus dressing with green chilli and coriander.',
      },
    ],
  },
  {
    id: 'brand-charlie',
    name: 'Brand Charlie',
    products: [
      {
        id: 'charlie-granola',
        name: 'Maple Granola',
        sku: 'CHR-MG-201',
        summary: 'Oat granola clusters with maple syrup and seeds.',
      },
      {
        id: 'charlie-oat-bites',
        name: 'Apple Oat Bites',
        sku: 'CHR-AO-202',
        summary: 'Soft oat snack bites with apple puree and cinnamon.',
      },
      {
        id: 'charlie-fruit-mix',
        name: 'Berry Fruit Mix',
        sku: 'CHR-BF-203',
        summary: 'Freeze-dried berry blend for breakfast toppings.',
      },
    ],
  },
]

export function getMockBrandById(brandId: string) {
  return mockBrands.find((brand) => brand.id === brandId)
}

export function getMockProductByIds(brandId: string, productId: string) {
  return getMockBrandById(brandId)?.products.find((product) => product.id === productId)
}