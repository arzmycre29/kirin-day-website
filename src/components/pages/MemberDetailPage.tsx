import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Instagram, Twitter, Youtube, Heart, Star, ShoppingBag, Loader2 } from 'lucide-react';
import { PageSkeleton } from '../PageSkeleton';

// Custom TikTok Icon SVG to ensure compatibility if Lucide icon version changes
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.51-.13-.1-.26-.21-.4-.32v5.72c.03 2.03-.74 4.07-2.23 5.43-1.48 1.4-3.66 2.01-5.67 1.77-2.01-.23-3.86-1.53-4.85-3.32C4.19 16 4.3 13.56 5.59 11.89c1.3-1.74 3.5-2.67 5.67-2.4v4.03c-1.39-.24-2.8.31-3.5 1.54-.7 1.18-.54 2.8.44 3.76.99.98 2.62 1.07 3.65.17.65-.56.96-1.47.92-2.32V.02h-.25z"/>
  </svg>
);

// Helper to parse Contentful Rich Text to string preserving paragraphs
function parseRichText(richTextObj: any): string {
  if (!richTextObj || !richTextObj.content) return 'No bio description available.';
  return richTextObj.content
    .map((block: any) => {
      if (block.nodeType === 'paragraph' && block.content) {
        return block.content
          .map((node: any) => node.value || '')
          .join('');
      }
      return '';
    })
    .filter((text: string) => text.trim() !== '')
    .join('\n\n');
}

export function MemberDetailPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  
  const [member, setMember] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchMemberDetail = async () => {
      if (!name) return;
      try {
        const { client } = await import('../../lib/contentful');
        
        // Fetch all members to prevent case sensitivity issues in Contentful queries
        const response = await client.getEntries({
          content_type: 'member',
          order: ['fields.name'],
        });

        const matchedItem = response.items.find(
          (item: any) => (item.fields.name || '').toLowerCase() === name.toLowerCase()
        );

        if (!matchedItem) {
          setError("Member tidak ditemukan.");
          setLoading(false);
          return;
        }

        const fields = matchedItem.fields;
        
        // Format member data with robust fallback for new fields
        const formattedMember = {
          id: matchedItem.sys.id,
          name: fields.name,
          role: fields.role || 'Member',
          image: fields.photo?.fields?.file?.url
            ? (fields.photo.fields.file.url.startsWith('//') ? 'https:' + fields.photo.fields.file.url : fields.photo.fields.file.url)
            : 'https://via.placeholder.com/600x800',
          color: fields.color || '#90CDF4',
          description: parseRichText(fields.description),
          instagram: fields.instagram || '',
          twitter: fields.twitter || '',
          youtube: fields.youtube || '',
          // New dynamic fields (with fallback)
          catchphrase: fields.catchphrase || '',
          birthdate: fields.birthdate || '',
          generation: fields.generation || '1st Generation',
          tiktok: fields.tiktok || '',
        };

        setMember(formattedMember);
        
        // Check if liked in localStorage
        const likedMembers = JSON.parse(localStorage.getItem('liked_members') || '[]');
        setIsLiked(likedMembers.includes(formattedMember.id));
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching member details:", err);
        setError("Gagal memuat detail member.");
        setLoading(false);
      }
    };

    fetchMemberDetail();
  }, [name]);

  const handleLikeToggle = () => {
    if (!member) return;
    const likedMembers = JSON.parse(localStorage.getItem('liked_members') || '[]');
    let updatedLikes = [];
    if (isLiked) {
      updatedLikes = likedMembers.filter((id: string) => id !== member.id);
      setIsLiked(false);
    } else {
      updatedLikes = [...likedMembers, member.id];
      setIsLiked(true);
    }
    localStorage.setItem('liked_members', JSON.stringify(updatedLikes));
  };

  if (loading) {
    return <PageSkeleton variant="profile" />;
  }

  if (error || !member) {
    return (
      <div className="min-h-screen pt-32 pb-32 px-6 bg-[#152238] flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-white/70 mb-6">{error || 'Gagal memuat detail member.'}</div>
          <Link
            to="/members"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[#90CDF4]/30 hover:border-[#90CDF4] bg-[#90CDF4]/10 hover:bg-[#90CDF4]/20 text-[#90CDF4] font-bold text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Member
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-32 px-6 bg-[#152238] relative overflow-hidden text-white">
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

      <div className="relative max-w-6xl mx-auto">
        {/* Back Link */}
        <div className="mb-10">
          <Link
            to="/members"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white font-bold transition-colors group"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span>Back to Members</span>
          </Link>
        </div>

        {/* Member Profile Grid */}
        <div className="flex flex-col md:flex-row gap-12 items-start">
          {/* Left Column: Portrait Photo */}
          <div className="w-full md:w-[45%] lg:w-[40%] flex-shrink-0 relative group">
            {/* Ambient Shadow glow based on member's custom color */}
            <div
              className="absolute -inset-1.5 rounded-3xl opacity-20 group-hover:opacity-40 transition duration-500 blur-xl pointer-events-none"
              style={{ background: member.color }}
            />
            
            <div className="relative aspect-[3/4] md:aspect-auto md:h-[550px] w-full rounded-3xl overflow-hidden border-2 border-white/15 bg-[#1a2f47] shadow-2xl">
              <img
                src={member.image}
                alt={member.name}
                className="w-full h-full object-cover object-center transition-transform duration-750 group-hover:scale-102"
              />
              
              {/* Image Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Heart/Like Button */}
              <button
                onClick={handleLikeToggle}
                className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg group/like cursor-pointer"
                aria-label={isLiked ? "Unlike member" : "Like member"}
              >
                <Heart
                  className={`w-6 h-6 transition-all duration-300 ${
                    isLiked
                      ? 'fill-red-500 text-red-500 scale-110'
                      : 'text-white/80 group-hover/like:text-red-400 group-hover/like:scale-105'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right Column: Profile Info */}
          <div className="flex-1 min-w-0 flex flex-col pt-4">
            {/* Badge Tags Row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Role Badge (uses member's custom color theme) */}
              <span
                className="px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase shadow-md"
                style={{
                  background: `${member.color}25`,
                  color: member.color,
                  border: `1.5px solid ${member.color}60`
                }}
              >
                {member.role}
              </span>
              
              {/* Generation Badge */}
              <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-white/5 border border-white/10 text-white/80 shadow-md">
                {member.generation}
              </span>
            </div>

            {/* Name */}
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-black mb-2 tracking-tight leading-none"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                color: member.color,
                textShadow: `0 0 45px ${member.color}35`
              }}
            >
              {member.name}
            </h1>

            {/* Sub-name / Catchphrase */}
            {member.catchphrase && (
              <p className="text-xl md:text-2xl text-white/50 font-medium mb-6 italic" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {member.catchphrase}
              </p>
            )}

            {/* Birthdate Row */}
            {member.birthdate && (
              <div className="flex items-center gap-2 text-white/70 mb-8 font-bold text-sm md:text-base">
                <Calendar className="w-5 h-5 text-[#F6E05E]" />
                <span>Born {member.birthdate}</span>
              </div>
            )}

            {/* Biography Description */}
            <div className="mb-10 text-base md:text-lg text-white/80 leading-relaxed max-w-2xl font-light" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <p className="whitespace-pre-wrap">{member.description}</p>
            </div>

            {/* Social Media "Follow" section */}
            <div className="mb-12">
              <h3 className="text-sm uppercase tracking-wider text-white/40 font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Follow {member.name}
              </h3>
              <div className="flex items-center gap-4">
                {/* Instagram */}
                {member.instagram && (
                  <a
                    href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center hover:scale-105 transition-all text-white/70 hover:text-white"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}

                {/* Twitter / X */}
                {member.twitter && (
                  <a
                    href={`https://twitter.com/${member.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center hover:scale-105 transition-all text-white/70 hover:text-white"
                    aria-label="Twitter"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}

                {/* TikTok */}
                {member.tiktok && (
                  <a
                    href={`https://tiktok.com/@${member.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center hover:scale-105 transition-all text-white/70 hover:text-white"
                    aria-label="TikTok"
                  >
                    <TikTokIcon className="w-5 h-5" />
                  </a>
                )}

                {/* YouTube */}
                {member.youtube && !member.tiktok && (
                  <a
                    href={member.youtube.startsWith('http') ? member.youtube : `https://youtube.com/${member.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center hover:scale-105 transition-all text-white/70 hover:text-white"
                    aria-label="YouTube"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                )}

                {!member.instagram && !member.twitter && !member.tiktok && !member.youtube && (
                  <span className="text-sm text-white/40">No social media links</span>
                )}
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Buy Cheki Button */}
              <button
                onClick={() => navigate(`/buy?member=${encodeURIComponent(member.name)}`)}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#90CDF4] to-[#4299E1] hover:from-[#63B3ED] hover:to-[#3182CE] text-[#152238] font-black text-sm tracking-wider uppercase transition-all shadow-xl hover:shadow-[#90CDF4]/25 hover:scale-[1.02] cursor-pointer"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <Star className="w-5 h-5 fill-current" />
                Buy Cheki
              </button>

              {/* Personal Merchandise Button */}
              <button
                onClick={() => navigate(`/buy?search=${encodeURIComponent(member.name)}`)}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/10 hover:border-white/20 bg-white/2 hover:bg-white/5 text-white font-black text-sm tracking-wider uppercase transition-all hover:scale-[1.02] cursor-pointer"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <ShoppingBag className="w-5 h-5" />
                Personal Merchandise
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
