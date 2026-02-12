import { Instagram, Twitter, Youtube, Award, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PageSkeleton } from '../PageSkeleton';
import { MemberModal } from '../MemberModal';

export function MembersPage() {
  // State for members and loading
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch members from Contentful
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Use Type Assertion or verify the import path for 'client' if TS complains
        // Assuming client is correctly typed from the library
        const { client } = await import('../../lib/contentful');

        const response = await client.getEntries({
          content_type: 'member',
          order: ['fields.name'],
        });

        const formattedMembers = response.items.map((item: any) => ({
          name: item.fields.name,
          role: item.fields.role,
          // Handle image safely (check if file url exists)
          image: item.fields.photo?.fields?.file?.url
            ? (item.fields.photo.fields.file.url.startsWith('//') ? 'https:' + item.fields.photo.fields.file.url : item.fields.photo.fields.file.url)
            : 'https://via.placeholder.com/400', // Fallback
          isSupport: item.fields.isSupport || false,
          supportLabel: item.fields.supportLabel || '',
          color: item.fields.color || '#90CDF4',
          funFact: item.fields.description?.content?.[0]?.content?.[0]?.value || 'No fun fact available.',
          instagram: item.fields.instagram || '',
          twitter: item.fields.twitter || '',
          youtube: item.fields.youtube || '',
          rawDescription: item.fields.description
        }));

        // Sort by role hierarchy: Captain > Member > Interim Member, then alphabetically
        const roleOrder: Record<string, number> = {
          'captain': 1,
          'member': 2,
          'interim member': 3
        };

        formattedMembers.sort((a: any, b: any) => {
          const aRole = a.role?.toLowerCase() || '';
          const bRole = b.role?.toLowerCase() || '';

          const aOrder = roleOrder[aRole] || 99;
          const bOrder = roleOrder[bRole] || 99;

          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.name.localeCompare(b.name);
        });

        setMembers(formattedMembers);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching members:", err);
        setError("Failed to load members properly.");
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const handleMemberClick = (member: any) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMember(null), 300);
  };

  if (loading) {
    return <PageSkeleton variant="cards" />;
  }

  if (error) {
    return (
      <div className="min-h-screen pt-32 pb-32 px-6 bg-[#152238] flex items-center justify-center">
        <div className="text-xl text-white/70">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-32 px-6 bg-[#152238]">
      {/* Striped Pattern Overlay */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
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
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Star className="w-10 h-10 text-[#90CDF4]" />
            <h1 className="text-5xl md:text-6xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '0 0 40px rgba(144, 205, 244, 0.3)' }}>
              MEET THE MEMBERS
            </h1>
            <Star className="w-10 h-10 text-[#90CDF4]" />
          </div>
          <div className="w-32 h-1 bg-[#F6E05E] mx-auto mb-6" />
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            7 Stars Shining Together • Each bringing unique talent and energy to create unforgettable performances
          </p>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map((member, index) => (
            <div
              key={index}
              className="group relative rounded-2xl overflow-hidden border-2 border-white/10 transition-all duration-300 hover:border-[#90CDF4]/40 hover:shadow-2xl hover:shadow-[#90CDF4]/20 hover:scale-[1.02] cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
              }}
              onClick={() => handleMemberClick(member)}
            >
              {/* Support Member Badge */}
              {member.isSupport && (
                <div className="absolute top-4 left-4 right-4 z-20">
                  <div
                    className="px-4 py-3 rounded-xl border-2 border-[#90CDF4] backdrop-blur-md"
                    style={{ background: 'rgba(144, 205, 244, 0.15)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-[#90CDF4]" />
                      <span className="text-xs font-black text-[#90CDF4] tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        SPECIAL SUPPORT
                      </span>
                    </div>
                    <p className="text-xs text-white/90 font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {member.supportLabel}
                    </p>
                  </div>
                </div>
              )}

              {/* Image */}
              <div className="relative h-96 overflow-hidden bg-[#1a2f47]">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#152238] via-[#152238]/50 to-transparent" />

                {/* Decorative Border on Hover */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                  style={{ background: member.color }}
                />
              </div>

              {/* Content */}
              <div className="p-8">
                <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {member.name}
                </h3>
                <p className="text-sm text-white/60 mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {member.role}
                </p>

                {/* Social Icons */}
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  {member.instagram && (
                    <a
                      href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 p-3 rounded-lg bg-white/5 hover:bg-[#90CDF4]/20 border border-white/10 hover:border-[#90CDF4]/30 transition-all group/btn"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5 text-white/60 group-hover/btn:text-[#90CDF4] mx-auto transition-colors" />
                    </a>
                  )}
                  {member.twitter && (
                    <a
                      href={`https://twitter.com/${member.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 p-3 rounded-lg bg-white/5 hover:bg-[#90CDF4]/20 border border-white/10 hover:border-[#90CDF4]/30 transition-all group/btn"
                      aria-label="Twitter"
                    >
                      <Twitter className="w-5 h-5 text-white/60 group-hover/btn:text-[#90CDF4] mx-auto transition-colors" />
                    </a>
                  )}
                  {member.youtube && (
                    <a
                      href={member.youtube.startsWith('http') ? member.youtube : `https://youtube.com/${member.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 p-3 rounded-lg bg-white/5 hover:bg-[#90CDF4]/20 border border-white/10 hover:border-[#90CDF4]/30 transition-all group/btn"
                      aria-label="YouTube"
                    >
                      <Youtube className="w-5 h-5 text-white/60 group-hover/btn:text-[#90CDF4] mx-auto transition-colors" />
                    </a>
                  )}
                  {!member.instagram && !member.twitter && !member.youtube && (
                    <span className="text-xs text-white/40">No social media</span>
                  )}
                </div>
              </div>

              {/* Accent Line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                style={{ background: member.color }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Member Modal */}
      {isModalOpen && selectedMember && (
        <MemberModal
          member={selectedMember}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}