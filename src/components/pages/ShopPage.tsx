import { ShoppingCart, Package, Star, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PageSkeleton } from '../PageSkeleton';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
  purchaseUrl: string;
  badge?: string;
  inStock: boolean;
}

export function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Cheki', 'Merchandise'];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { client } = await import('../../lib/contentful');
        const response = await client.getEntries({
          content_type: 'product',
          order: ['fields.name'],
        });

        const formattedProducts: Product[] = response.items.map((item: any) => ({
          id: item.sys.id,
          name: item.fields.name || 'Untitled Product',
          description: item.fields.description || '',
          price: item.fields.price || 'TBA',
          category: item.fields.category || 'Merchandise',
          image: item.fields.image?.fields?.file?.url
            ? (item.fields.image.fields.file.url.startsWith('//') ? 'https:' + item.fields.image.fields.file.url : item.fields.image.fields.file.url)
            : 'https://via.placeholder.com/400',
          purchaseUrl: item.fields.purchaseUrl || '#',
          badge: item.fields.badge || undefined,
          inStock: item.fields.inStock !== false, // Default to true if not set
        }));

        setProducts(formattedProducts);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setLoading(false);
        // Fallback to empty - no hardcoded data
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory);

  if (loading) {
    return <PageSkeleton variant="cards" />;
  }

  return (
    <div className="min-h-screen pt-32 pb-32 px-6 bg-[#1a2f47]">
      {/* Striped Pattern Overlay - Header Only */}
      <div
        className="fixed top-0 left-0 right-0 h-96 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(246, 224, 94, 0.1) 10px,
            rgba(246, 224, 94, 0.1) 20px
          )`
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <ShoppingCart className="w-10 h-10 text-[#90CDF4]" />
            <h1 className="text-5xl md:text-6xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '0 0 40px rgba(144, 205, 244, 0.3)' }}>
              SHOP
            </h1>
          </div>
          <div className="w-32 h-1 bg-[#F6E05E] mx-auto mb-6" />
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Official Kirin Day Merchandise • Support your favorite members with exclusive items
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-8 py-3 rounded-full font-black transition-all duration-300 border-2 ${activeCategory === category
                ? 'bg-[#90CDF4] text-[#1a2f47] border-[#90CDF4] shadow-lg shadow-[#90CDF4]/30'
                : 'bg-transparent text-white/70 border-white/20 hover:border-[#90CDF4]/50 hover:text-white'
                }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-xl text-white/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              No products found in this category.
            </p>
            <p className="text-sm text-white/30 mt-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Add products via Contentful to display them here.
            </p>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group relative rounded-2xl overflow-hidden border-2 border-white/10 transition-all duration-300 hover:border-[#90CDF4]/40 hover:shadow-2xl hover:shadow-[#90CDF4]/20 hover:scale-[1.02]"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              {/* Badge */}
              {product.badge && (
                <div className="absolute top-4 right-4 z-20">
                  <div
                    className="px-4 py-2 rounded-full border-2 border-[#F6E05E] backdrop-blur-sm"
                    style={{ background: 'rgba(246, 224, 94, 0.2)' }}
                  >
                    <span className="text-xs font-black text-[#F6E05E] tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {product.badge}
                    </span>
                  </div>
                </div>
              )}

              {/* Product Image */}
              <div className="relative h-80 overflow-hidden bg-[#0f1a2a]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a2f47] via-transparent to-transparent" />
              </div>

              {/* Product Info */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {product.name}
                  </h3>
                  <p className="text-sm text-white/60 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {product.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-black text-[#F6E05E]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {product.price}
                    </span>
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-[#90CDF4]' : 'bg-red-400'}`} />
                    <span className={`text-xs font-bold ${product.inStock ? 'text-[#90CDF4]' : 'text-red-400'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                {/* Buy Now Button - Links to External URL */}
                <a
                  href={product.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full px-6 py-4 rounded-full font-black transition-all duration-300 flex items-center justify-center gap-2 ${product.inStock
                    ? 'bg-[#F6E05E] text-[#1a2f47] hover:scale-105 hover:shadow-xl hover:shadow-[#F6E05E]/30'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  onClick={(e) => !product.inStock && e.preventDefault()}
                >
                  <ExternalLink className="w-5 h-5" />
                  {product.inStock ? 'BUY NOW' : 'SOLD OUT'}
                </a>
              </div>

              {/* Bottom Accent Line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F6E05E] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div
          className="mt-20 p-12 rounded-2xl border-2 border-[#90CDF4]/30 text-center"
          style={{ background: 'rgba(144, 205, 244, 0.05)' }}
        >
          <Star className="w-12 h-12 text-[#F6E05E] mx-auto mb-6" />
          <h3 className="text-3xl font-black text-white mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Looking for Something Special?
          </h3>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Contact us for custom orders, bulk purchases, or special event merchandise
          </p>
          <a
            href="mailto:info@kirinday.id"
            className="inline-block px-10 py-4 rounded-full border-2 border-[#90CDF4] text-[#90CDF4] font-black hover:bg-[#90CDF4]/10 transition-all duration-300"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            CONTACT US
          </a>
        </div>
      </div>
    </div>
  );
}
