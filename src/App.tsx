import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Image as ImageIcon, LayoutTemplate, Newspaper, MonitorSmartphone, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [images, setImages] = useState<{
    base?: string;
    billboard?: string;
    newspaper?: string;
    social?: string;
  }>({});
  const [error, setError] = useState('');

  const generateImages = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    setError('');
    setImages({});
    setProgress('Generating base product shot...');

    try {
      // 1. Generate Base Image
      const basePrompt = `A high-quality, professional product photography shot of: ${description}. Clean studio background, perfect lighting. Absolutely NO people in the image.`;
      const baseResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: basePrompt,
      });

      let base64Image = '';
      for (const part of baseResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }

      if (!base64Image) throw new Error('Failed to generate base image');

      const baseImageUrl = `data:image/png;base64,${base64Image}`;
      setImages((prev) => ({ ...prev, base: baseImageUrl }));

      const mediums = [
        { key: 'billboard', name: 'Billboard', prompt: 'Edit this image to place the exact same product on a large outdoor city billboard. Do not change the product itself. The product should be the main focus. Absolutely NO people in the image.' },
        { key: 'newspaper', name: 'Newspaper', prompt: 'Edit this image to make the exact same product part of a vintage black and white newspaper advertisement page. Do not change the product itself. Absolutely NO people in the image.' },
        { key: 'social', name: 'Social Post', prompt: 'Edit this image to create an aesthetic Instagram social media post featuring the exact same product, with UI elements like hearts and comments around it. Do not change the product itself. Absolutely NO people in the image.' },
      ];

      for (const medium of mediums) {
        setProgress(`Generating ${medium.name} mockup...`);
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: base64Image,
                    mimeType: 'image/png',
                  },
                },
                {
                  text: medium.prompt,
                },
              ],
            },
          });

          let mediumBase64 = '';
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              mediumBase64 = part.inlineData.data;
              break;
            }
          }

          if (mediumBase64) {
            setImages((prev) => ({ ...prev, [medium.key]: `data:image/png;base64,${mediumBase64}` }));
          }
        } catch (e) {
          console.error(`Failed to generate ${medium.key}:`, e);
        }
      }
      setProgress('Done!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating images.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(''), 2000);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-2 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-serif font-semibold tracking-tight">Brand Builder</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Input */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-serif font-semibold leading-tight">
              Imagine your product everywhere.
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Describe your product in detail. We'll generate a base studio shot and automatically place it across different advertising mediums while maintaining brand consistency.
            </p>
          </div>

          <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Product Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. A sleek, matte black reusable water bottle with a bamboo cap..."
                className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none text-sm"
                disabled={isGenerating}
              />
            </div>

            <button
              onClick={generateImages}
              disabled={isGenerating || !description.trim()}
              className="w-full bg-black text-white rounded-xl py-3 px-4 font-medium flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {progress || 'Generating...'}
                </>
              ) : (
                <>
                  Build Brand <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultCard
              title="Base Product"
              icon={<ImageIcon className="w-4 h-4" />}
              image={images.base}
              isLoading={isGenerating && !images.base}
              delay={0.1}
            />
            <ResultCard
              title="Billboard Ad"
              icon={<LayoutTemplate className="w-4 h-4" />}
              image={images.billboard}
              isLoading={isGenerating && images.base && !images.billboard}
              delay={0.2}
            />
            <ResultCard
              title="Newspaper Feature"
              icon={<Newspaper className="w-4 h-4" />}
              image={images.newspaper}
              isLoading={isGenerating && images.billboard && !images.newspaper}
              delay={0.3}
            />
            <ResultCard
              title="Social Campaign"
              icon={<MonitorSmartphone className="w-4 h-4" />}
              image={images.social}
              isLoading={isGenerating && images.newspaper && !images.social}
              delay={0.4}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function ResultCard({ title, icon, image, isLoading, delay }: { title: string; icon: React.ReactNode; image?: string; isLoading: boolean; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
    >
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
        <div className="text-gray-400">{icon}</div>
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      </div>
      <div className="aspect-square bg-gray-50 relative flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {image ? (
            <motion.img
              key="image"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              src={image}
              alt={title}
              className="w-full h-full object-contain rounded-xl shadow-sm"
            />
          ) : isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 text-gray-400"
            >
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-medium uppercase tracking-wider">Generating</span>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-300 flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                {icon}
              </div>
              <span className="text-xs font-medium">Awaiting generation</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
