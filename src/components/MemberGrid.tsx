import { Instagram, Twitter, Youtube, Award } from 'lucide-react';

export function MemberGrid() {
  const members = [
    {
      name: 'Aiko',
      role: 'Leader / Main Vocalist',
      image: 'https://images.unsplash.com/photo-1564752423896-11d52fbf3257?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc2ODkwNDkxMXww&ixlib=rb-4.1.0&q=80&w=1080',
      isSupport: false
    },
    {
      name: 'Yuki',
      role: 'Main Dancer / Vocalist',
      image: 'https://images.unsplash.com/photo-1564752423896-11d52fbf3257?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc2ODkwNDkxMXww&ixlib=rb-4.1.0&q=80&w=1080',
      isSupport: false
    },
    {
      name: 'Sakura',
      role: 'Lead Vocalist',
      image: 'https://images.unsplash.com/photo-1564752423896-11d52fbf3257?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc2ODkwNDkxMXww&ixlib=rb-4.1.0&q=80&w=1080',
      isSupport: false
    },
    {
      name: 'Bubu',
      role: 'Guest Performer',
      image: 'https://images.unsplash.com/photo-1564752423896-11d52fbf3257?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc2ODkwNDkxMXww&ixlib=rb-4.1.0&q=80&w=1080',
      isSupport: true
    },
    {
      name: 'Hana',
      role: 'Vocalist / Rapper',
      image: 'https://images.unsplash.com/photo-1564752423896-11d52fbf3257?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc2ODkwNDkxMXww&ixlib=rb-4.1.0&q=80&w=1080',
      isSupport: false
    },
    {
      name: 'Mika',
      role: 'Lead Dancer',
      image: 'https://images.unsplash.com/photo-1564752423896-11d52fbf3257?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc2ODkwNDkxMXww&ixlib=rb-4.1.0&q=80&w=1080',
      isSupport: false
    },
    {
      name: 'Rina',
      role: 'Maknae / Vocalist',
      image: 'https://images.unsplash.com/photo-1564752423896-11d52fbf3257?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc2ODkwNDkxMXww&ixlib=rb-4.1.0&q=80&w=1080',
      isSupport: false
    }
  ];

  return (
    <section id="members" className="py-32 px-6 bg-[#152238]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-[#90CDF4] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            MEET THE MEMBERS
          </h2>
          <div className="w-24 h-1 bg-[#F6E05E] mx-auto mb-4" />
          <p className="text-white/60 text-base" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            7 Stars Shining Together
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {members.map((member, index) => (
            <div 
              key={index}
              className="group relative rounded-xl overflow-hidden border border-white/10 transition-all duration-300 hover:border-[#90CDF4]/40 hover:shadow-xl hover:shadow-[#90CDF4]/10"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              {/* Support Member Badge */}
              {member.isSupport && (
                <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-[#F6E05E] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#1a2f47]" />
                  <span className="text-xs font-black text-[#1a2f47] tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    SUPPORT
                  </span>
                </div>
              )}
              
              {/* Image */}
              <div className="relative h-80 overflow-hidden bg-[#1a2f47]">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#152238] via-transparent to-transparent opacity-60" />
              </div>
              
              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {member.name}
                </h3>
                <p className="text-sm text-white/60 mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {member.role}
                </p>
                
                {/* Social Icons */}
                <div className="flex items-center gap-3">
                  <button 
                    className="p-2 rounded-full bg-white/5 hover:bg-[#90CDF4]/20 border border-white/10 hover:border-[#90CDF4]/30 transition-all"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4 text-white/60 hover:text-[#90CDF4]" />
                  </button>
                  <button 
                    className="p-2 rounded-full bg-white/5 hover:bg-[#90CDF4]/20 border border-white/10 hover:border-[#90CDF4]/30 transition-all"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-4 h-4 text-white/60 hover:text-[#90CDF4]" />
                  </button>
                  <button 
                    className="p-2 rounded-full bg-white/5 hover:bg-[#90CDF4]/20 border border-white/10 hover:border-[#90CDF4]/30 transition-all"
                    aria-label="YouTube"
                  >
                    <Youtube className="w-4 h-4 text-white/60 hover:text-[#90CDF4]" />
                  </button>
                </div>
              </div>
              
              {/* Accent Line - Only on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F6E05E] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}