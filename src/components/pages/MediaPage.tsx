import { Play, Image as ImageIcon, Video as VideoIcon, Folder, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PageSkeleton } from '../PageSkeleton';

interface Album {
    title: string;
    slug: string;
    coverImage: string;
    eventDate: string;
    photoCount: number;
    photos: Array<{ title: string; image: string; caption: string }>;
}

export function MediaPage() {
    const [videos, setVideos] = useState<any[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'photos' | 'videos'>('all');
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { client } = await import('../../lib/contentful');

                // Fetch Videos
                const videoResponse = await client.getEntries({
                    content_type: 'video',
                    order: ['-sys.createdAt']
                });

                // Fetch Photo Albums
                const albumResponse = await client.getEntries({
                    content_type: 'photoAlbum',
                    order: ['-fields.eventDate']
                });

                setVideos(videoResponse.items.map((item: any) => ({
                    title: item.fields.title,
                    youtubeUrl: item.fields.youtubeUrl,
                    thumbnail: item.fields.thumbnail?.fields?.file?.url
                        ? (item.fields.thumbnail.fields.file.url.startsWith('//') ? 'https:' + item.fields.thumbnail.fields.file.url : item.fields.thumbnail.fields.file.url)
                        : 'https://via.placeholder.com/640x360',
                    description: item.fields.description || '',
                    isFeatured: item.fields.isFeatured || false
                })));

                setAlbums(albumResponse.items.map((item: any) => {
                    const photos = item.fields.photos?.map((photo: any) => ({
                        title: photo.fields?.title || '',
                        image: photo.fields?.image?.fields?.file?.url
                            ? (photo.fields.image.fields.file.url.startsWith('//') ? 'https:' + photo.fields.image.fields.file.url : photo.fields.image.fields.file.url)
                            : 'https://via.placeholder.com/400',
                        caption: photo.fields?.caption || ''
                    })) || [];

                    return {
                        title: item.fields.title,
                        slug: item.fields.slug,
                        coverImage: item.fields.coverImage?.fields?.file?.url
                            ? (item.fields.coverImage.fields.file.url.startsWith('//') ? 'https:' + item.fields.coverImage.fields.file.url : item.fields.coverImage.fields.file.url)
                            : 'https://via.placeholder.com/400',
                        eventDate: item.fields.eventDate || '',
                        photoCount: photos.length,
                        photos
                    };
                }));

                setLoading(false);
            } catch (error) {
                console.error("Error fetching media:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return <PageSkeleton variant="cards" />;
    }

    // Album Detail View
    if (selectedAlbum) {
        return (
            <div className="min-h-screen pt-32 pb-32 px-6 bg-[#152238]">
                <div className="fixed inset-0 opacity-5 pointer-events-none"
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
                    {/* Back Button & Album Header */}
                    <div className="mb-12">
                        <button
                            onClick={() => setSelectedAlbum(null)}
                            className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span style={{ fontFamily: 'Montserrat, sans-serif' }}>Back to Albums</span>
                        </button>

                        <h1 className="text-4xl md:text-5xl font-black text-[#90CDF4] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {selectedAlbum.title}
                        </h1>
                        <div className="flex items-center gap-4 text-white/60">
                            <span style={{ fontFamily: 'Montserrat, sans-serif' }}>{formatDate(selectedAlbum.eventDate)}</span>
                            <span>•</span>
                            <span style={{ fontFamily: 'Montserrat, sans-serif' }}>{selectedAlbum.photoCount} photos</span>
                        </div>
                    </div>

                    {/* Photos Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedAlbum.photos.map((photo, idx) => (
                            <div key={idx} className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer">
                                <img src={photo.image} alt={photo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <p className="text-white font-bold text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>{photo.title}</p>
                                    {photo.caption && <p className="text-white/60 text-xs mt-1">{photo.caption}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedAlbum.photos.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-white/50 text-xl">No photos in this album yet.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Main Gallery View (Albums + Videos)
    return (
        <div className="min-h-screen pt-32 pb-32 px-6 bg-[#152238]">
            <div className="fixed inset-0 opacity-5 pointer-events-none"
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
                        <ImageIcon className="w-10 h-10 text-[#90CDF4]" />
                        <h1 className="text-5xl md:text-6xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '0 0 40px rgba(144, 205, 244, 0.3)' }}>
                            MEDIA GALLERY
                        </h1>
                    </div>
                    <div className="w-32 h-1 bg-[#F6E05E] mx-auto mb-8" />

                    {/* Filter Tabs */}
                    <div className="flex justify-center gap-4">
                        {['all', 'photos', 'videos'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-6 py-2 rounded-full font-bold transition-all duration-300 capitalize ${activeTab === tab
                                    ? 'bg-[#F6E05E] text-[#1a2f47] scale-105'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Video Section */}
                {(activeTab === 'all' || activeTab === 'videos') && videos.length > 0 && (
                    <div className="mb-24">
                        <div className="flex items-center gap-3 mb-8">
                            <VideoIcon className="w-6 h-6 text-[#90CDF4]" />
                            <h3 className="text-2xl font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                VIDEOS
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {videos.map((video, idx) => (
                                <div key={idx} className="group rounded-xl overflow-hidden bg-[#1a2f47] border border-white/10 hover:border-[#F6E05E]/50 transition-all">
                                    <div className="relative aspect-video">
                                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                        <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                                            <div className="w-16 h-16 rounded-full bg-[#F6E05E] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <Play className="w-6 h-6 text-[#1a2f47] ml-1" />
                                            </div>
                                        </a>
                                    </div>
                                    <div className="p-6">
                                        <h4 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>{video.title}</h4>
                                        <p className="text-white/60 text-sm line-clamp-2">{video.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Photo Albums Section */}
                {(activeTab === 'all' || activeTab === 'photos') && albums.length > 0 && (
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <Folder className="w-6 h-6 text-[#90CDF4]" />
                            <h3 className="text-2xl font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                PHOTO ALBUMS
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {albums.map((album, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedAlbum(album)}
                                    className="group cursor-pointer"
                                >
                                    {/* Album Folder Card */}
                                    <div className="relative aspect-square rounded-xl overflow-hidden bg-[#1a2f47] border-2 border-white/10 hover:border-[#90CDF4]/50 transition-all hover:scale-105">
                                        {/* Cover Image */}
                                        <img
                                            src={album.coverImage}
                                            alt={album.title}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />

                                        {/* Folder Overlay Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#152238] via-[#152238]/30 to-transparent" />

                                        {/* Album Info */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Folder className="w-4 h-4 text-[#F6E05E]" />
                                                <span className="text-xs text-white/60" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                                    {album.photoCount} photos
                                                </span>
                                            </div>
                                            <h4 className="text-white font-bold text-sm md:text-base truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                                {album.title}
                                            </h4>
                                            {album.eventDate && (
                                                <p className="text-white/50 text-xs mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                                    {formatDate(album.eventDate)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && videos.length === 0 && albums.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-white/50 text-xl">No media found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
