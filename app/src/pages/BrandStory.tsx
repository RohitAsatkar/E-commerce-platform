
const BrandStory = () => {
  return (
    <div className="section" style={{ paddingTop: '120px' }}>
      <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Our Story</h1>
        <div style={{ position: 'relative', paddingBottom: '56.25%', marginBottom: '3rem', backgroundColor: '#f5f5f5' }}>
          <img 
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1200" 
            alt="Brand Story" 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
        <div style={{ textAlign: 'left', fontSize: '1.125rem', lineHeight: '1.8', color: 'var(--color-text)' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            Founded in 2024, AURA was born from a desire to redefine modern luxury. We observed a fashion landscape cluttered with fleeting trends and excessive branding, and we sought to offer an alternative: a return to elegance, simplicity, and uncompromising quality.
          </p>
          <p style={{ marginBottom: '1.5rem' }}>
            At AURA, we believe that true style speaks softly. Our collections are designed with a minimalist aesthetic, focusing on clean lines, sophisticated silhouettes, and neutral color palettes. We create pieces that are not meant for a single season, but are crafted to become enduring staples in your wardrobe.
          </p>
          <p style={{ marginBottom: '1.5rem' }}>
            Sustainability and ethical manufacturing are at the core of our philosophy. We carefully source premium materials—from organic cottons to responsibly milled silks and leathers—ensuring that every garment not only looks exquisite but also respects the environment and the artisans who create it.
          </p>
          <h2 style={{ fontSize: '2rem', marginTop: '3rem', marginBottom: '1.5rem', textAlign: 'center' }}>The AURA Promise</h2>
          <p style={{ textAlign: 'center' }}>
            We promise to deliver luxury that is accessible, ethical, and timeless. Join us in embracing a lifestyle where less is undeniably more.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrandStory;
