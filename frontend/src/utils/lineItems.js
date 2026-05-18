let localLineCounter = 0;

export const createLineId = () => {
  localLineCounter += 1;
  return `line-${localLineCounter}`;
};

export const createLineItem = (overrides = {}) => ({
  id: createLineId(),
  productId: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  tvaRate: 19,
  ...overrides,
});

export const buildProductLineDescription = (product = {}) => {
  const name = String(product.name || '').trim();
  const description = String(product.description || '').trim();

  if (name && description) return `${name} - ${description}`;
  return name || description;
};
