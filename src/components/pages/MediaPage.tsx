import { Play, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

export function MediaPage() {
    const [videos, setVideos] = useState<any[]>([]);
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'photos' | 'videos'>('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { client } = await import('../../lib/contentful');

                // Fetch Videos
                const videoResponse = await client.getEntries({
                    content_type: 'video',
                    order: ['-sys.createdAt']
                });

                // Fetch Photos
                const photoResponse = await client.getEntries({
                    content_type: 'galleryImage',
                    order: ['-sys.createdAt']
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

                setPhotos(photoResponse.items.map((item: any) => ({
                    title: item.fields.title,
                    image: item.fields.image?.fields?.file?.url
                        ? (item.fields.image.fields.file.url.startsWith('//') ? 'https:' + item.fields.image.fields.file.url : item.fields.image.fields.file.url)
                        : 'https://via.placeholder.com/400',
                    caption: item.fields.caption || ''
                })));

                setLoading(false);
            } catch (error) {
                console.error("Error fetching media:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen pt-32 pb-32 px-6 bg-[#152238] flex items-center justify-center">
                <div className="text-2xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    LOADING GALLERY...
                </div>
            </div>
        );
    }

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

                {/* Photo Grid */}
                {(activeTab === 'all' || activeTab === 'photos') && photos.length > 0 && (
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <ImageIcon className="w-6 h-6 text-[#90CDF4]" />
                            <h3 className="text-2xl font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                PHOTOS
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {photos.map((photo, idx) => (
                                <div key={idx} className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer">
                                    <img src={photo.image} alt={photo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                        <p className="text-white font-bold text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>{photo.title}</p>
                                        {photo.caption && <p className="text-white/60 text-xs mt-1">{photo.caption}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && videos.length === 0 && photos.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-white/50 text-xl">No media found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
