import React, { useState } from 'react';
import { 
  Minus, 
  Plus, 
  ArrowRight, 
  Smile, 
  MoreHorizontal, 
  Divide, 
  MoveRight,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

// Button Component
const Button = ({ 
  children, 
  variant = 'primary', 
  className,
  iconRight,
  ...props 
}: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'ghost'; 
  className?: string;
  iconRight?: React.ReactNode;
  [key: string]: any;
}) => {
  const variants = {
    primary: "bg-[#9FB0A5] text-white hover:bg-[#8da093] shadow-sm",
    secondary: "bg-white text-[#1C1C1E] border border-transparent hover:border-gray-200 shadow-sm",
    ghost: "bg-transparent text-[#1C1C1E] hover:bg-black/5",
  };

  return (
    <button 
      className={cn(
        "h-12 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all font-medium text-[16px]",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
      {iconRight && <span className="ml-1">{iconRight}</span>}
    </button>
  );
};

// Chip/Segment Component
const ChipGroup = () => {
  const [selected, setSelected] = useState('45');
  const options = ['20', '30', '30', '45', '60', '90'];

  return (
    <div className="flex items-center bg-[#EFEEE9] p-1.5 rounded-full w-fit shadow-inner gap-1">
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => setSelected(opt)}
          className={cn(
            "h-8 px-3 rounded-full text-sm font-medium transition-all",
            selected === opt 
              ? "bg-[#9FB0A5] text-white shadow-sm" 
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {opt}
        </button>
      ))}
      <div className="w-8 h-8 flex items-center justify-center text-gray-400">
        <Plus size={14} />
      </div>
    </div>
  );
};

// Motion Slider Component
const MotionSlider = () => {
  return (
    <div className="flex items-center gap-4 w-full max-w-xs text-[#9FB0A5]">
      <div className="h-1 flex-1 bg-gray-200 rounded-full relative">
        <div className="absolute left-0 top-0 bottom-0 w-2/3 bg-[#9FB0A5] rounded-full opacity-30"></div>
        <div className="absolute left-2/3 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#9FB0A5] rounded-full shadow-md"></div>
      </div>
      <span className="text-xl font-bold text-[#9FB0A5]">3</span>
      <ArrowRight size={20} />
    </div>
  );
};

// Duration Picker
const DurationPicker = () => {
  const [active, setActive] = useState('Soru');
  
  return (
    <div className="flex items-center bg-white p-1 rounded-2xl shadow-sm w-fit">
      <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#9FB0A5] text-white mr-2">
        <Divide size={16} />
      </button>
      <div className="flex relative bg-[#F5F5F0] rounded-xl p-1">
        {['Konu', 'Soru', 'Karışık'].map((item) => (
          <button
            key={item}
            onClick={() => setActive(item)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all relative z-10",
              active === item ? "text-white" : "text-gray-500"
            )}
          >
            {item}
            {active === item && (
              <motion.div 
                layoutId="duration-bg"
                className="absolute inset-0 bg-[#8E9B90] rounded-lg shadow-sm -z-10"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Topic Mood Item
const TopicMoodItem = ({ 
  title, 
  value, 
  icon 
}: { 
  title: string; 
  value: number; 
  icon?: React.ReactNode 
}) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-gray-700 font-medium">{title}</span>
      <div className="flex items-center gap-4">
        <span className="text-gray-500 font-medium">{value}</span>
        {icon && (
          <div className="w-8 h-8 rounded-full bg-[#EFECE5] flex items-center justify-center text-gray-500 shadow-sm">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen w-full bg-[#F0EFE9] font-sans selection:bg-[#9FB0A5] selection:text-white pb-20 overflow-x-hidden">
      {/* Background Shapes */}
      <div className="fixed top-0 left-0 w-full h-[500px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] bg-[#E1E5E0] rounded-full blur-[80px] opacity-60"></div>
        <div className="absolute top-[-200px] right-[-100px] w-[700px] h-[700px] bg-[#E8E6DE] rounded-full blur-[100px] opacity-70"></div>
      </div>

      {/* Header */}
      <header className="pt-16 pb-12 text-center">
        <h1 className="text-4xl font-bold text-[#3A3A3C] mb-2 tracking-tight">Ritim</h1>
        <p className="text-[#6C6C70] text-lg font-normal">Style Guide</p>
      </header>

      {/* Main Content Card */}
      <div className="max-w-[1000px] mx-auto bg-[#FDFDFD] rounded-[40px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] p-12 border border-white/50">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          
          {/* LEFT COLUMN */}
          <div className="space-y-12">
            
            {/* Colors Section */}
            <section>
              <h3 className="text-[#1C1C1E] font-medium mb-6">Colors</h3>
              <p className="text-sm text-gray-500 mb-4">Neutrals</p>
              
              <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-[#FAFAF9] p-4 rounded-2xl shadow-sm border border-black/5">
                  <div className="text-xs text-gray-400 font-medium mb-1">Bg - Primary</div>
                  <div className="text-xs text-gray-300">#FAFAF9</div>
                </div>
                <div className="flex-1 bg-[#FFFFFF] p-4 rounded-2xl shadow-sm border border-black/5">
                  <div className="text-xs text-gray-400 font-medium mb-1">Surface</div>
                  <div className="text-xs text-gray-300">#FFFFFF</div>
                </div>
              </div>

              <div className="flex gap-4 mb-8">
                <div className="flex-1 bg-[#F2F2F2] p-4 rounded-2xl shadow-sm border border-black/5">
                  <div className="text-xs text-gray-400 font-medium mb-1">Text - Primary</div>
                  <div className="text-xs text-gray-300">#1C1C1E</div>
                </div>
                <div className="flex-1 bg-gradient-to-br from-[#8E9B90] to-[#5E6E66] p-4 rounded-2xl shadow-md flex items-center justify-center text-white relative overflow-hidden group">
                   <div className="absolute top-2 right-2 w-3 h-3 bg-white/20 rounded-full"></div>
                   <span className="text-sm font-medium opacity-90">Accent</span>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-4">Preview</p>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#9FB0A5]"></div>
                <div className="w-6 h-6 rounded-full bg-[#D1D5D2]"></div>
                <div className="text-2xl font-medium text-[#8E9B90] ml-2">Aa Bb</div>
                <div className="w-8 h-8 rounded-full bg-[#EFECE5] flex items-center justify-center ml-2">
                   <Smile size={18} className="text-gray-500" />
                </div>
                <div className="w-6 h-6 rounded-full bg-[#F0F0F0]"></div>
                <div className="w-6 h-6 rounded-full bg-[#FAFAFA] border border-gray-100"></div>
              </div>
            </section>

            <div className="w-full h-px bg-gray-100"></div>

            {/* Buttons Section */}
            <section>
              <h3 className="text-[#1C1C1E] font-medium mb-6">Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <Button>Bugün odaklandım</Button>
                <Button variant="secondary" iconRight={<ArrowRight size={16} />}>Günler</Button>
              </div>
            </section>

            <div className="w-full h-px bg-gray-100"></div>

            {/* Chips Section */}
            <section>
              <h3 className="text-[#1C1C1E] font-medium mb-6">Chips</h3>
              <ChipGroup />
            </section>

            <div className="w-full h-px bg-gray-100"></div>

            {/* Components Section */}
            <section>
              <h3 className="text-[#1C1C1E] font-medium mb-6">Components</h3>
              <div className="flex flex-wrap gap-4">
                <Button className="rounded-full px-8 bg-[#8E9B90]">Bugün odaklandım</Button>
                <Button variant="secondary" className="rounded-full" iconRight={<ArrowRight size={16} />}>Günler</Button>
              </div>
            </section>

            <div className="w-full h-px bg-gray-100"></div>

            {/* Motion Section */}
            <section>
              <h3 className="text-[#1C1C1E] font-medium mb-6">Motion</h3>
              
              <div className="mb-8 pl-2">
                 <MotionSlider />
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center bg-[#F7F7F6] rounded-2xl p-1 shadow-inner">
                  <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600"><Minus size={18} /></button>
                  <span className="w-12 text-center font-medium text-gray-700">5 dk</span>
                  <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600"><Plus size={18} /></button>
                </div>

                <Button className="bg-[#8E9B90] rounded-xl px-4 h-12 text-sm">+ 40 dk <Plus size={16} /></Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="px-6 py-3 rounded-full border border-gray-200 text-gray-600 font-medium">Fade</div>
                <div className="w-16 h-8 bg-[#D1D5D2] rounded-full relative p-1">
                  <div className="w-6 h-6 bg-white rounded-full shadow-sm"></div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
                <div className="w-4 h-4 bg-[#8E9B90] rounded-full"></div>
                <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Bottom Sheet</span>
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-12">
            
            {/* Typography Section */}
            <section>
              <h3 className="text-[#1C1C1E] font-medium mb-6">Typography</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-semibold text-[#1C1C1E]">Title / Large</span>
                    <span className="text-gray-400 text-sm">24 Semibold</span>
                  </div>
                  <span className="bg-[#B4BFB8] text-white text-[10px] px-2 py-1 rounded-full font-medium">SF Pro</span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-lg font-semibold text-[#1C1C1E]">Title / Medium</span>
                  <span className="text-gray-400 text-sm">18 Semibold</span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-base text-[#1C1C1E]">Body</span>
                  <span className="text-gray-400 text-sm">16px Regular</span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-base text-[#1C1C1E]">Button</span>
                  <span className="text-gray-400 text-sm">16px Regular</span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-sm text-[#1C1C1E]">Caption</span>
                  <span className="text-gray-400 text-xs">14 Regular</span>
                </div>
              </div>
            </section>

            <div className="w-full h-px bg-gray-100"></div>

            {/* Spacing & Radius Section */}
            <section>
              <h3 className="text-[#1C1C1E] font-medium mb-6">Spacing & Radius</h3>
              <div className="flex items-center gap-3 flex-wrap mb-8">
                {['4px', '8px', '12px', '16px'].map(size => (
                  <div key={size} className="px-4 py-2 bg-[#F2F2F2] rounded-full text-xs text-gray-500 shadow-sm border border-white">
                    {size}
                  </div>
                ))}
                <div className="px-4 py-2 bg-[#F2F2F2] rounded-full text-xs text-gray-500 shadow-sm border border-white flex items-center gap-2">
                    <span>24</span>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span>32</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">Radius</p>
              <div className="flex items-center gap-2 p-1.5 bg-[#F7F7F6] rounded-full w-fit">
                 <div className="px-4 py-1.5 text-xs text-gray-500">Default</div>
                 <div className="px-4 py-1.5 bg-[#9FB0A5] text-white rounded-full text-xs shadow-sm">7E1 dL</div>
                 <div className="px-4 py-1.5 text-xs text-gray-500 border-l border-gray-200">30</div>
                 <div className="px-4 py-1.5 text-xs text-gray-500 border-l border-gray-200">45</div>
                 <div className="px-4 py-1.5 text-xs text-gray-500 border-l border-gray-200">90</div>
              </div>
            </section>

            <div className="w-full h-px bg-gray-100"></div>

            {/* Duration Picker Section */}
            <section>
              <h3 className="text-[#1C1C1E] font-medium mb-6">Duration Picker</h3>
              <DurationPicker />
            </section>

            <div className="w-full h-px bg-gray-100"></div>

            {/* Closure Dots */}
            <section>
              <h3 className="text-[#1C1C1E] font-medium mb-6">Closure Dots</h3>
              <div className="flex gap-2">
                 {[1, 2, 3, 4, 5].map(i => (
                   <div key={i} className="w-3 h-3 rounded-full bg-[#9FB0A5]"></div>
                 ))}
                 {[1, 2, 3, 4].map(i => (
                   <div key={i} className="w-3 h-3 rounded-full bg-[#E5E5E5]"></div>
                 ))}
              </div>
            </section>

            <div className="w-full h-px bg-gray-100"></div>

            {/* Topic Mood */}
            <section>
              <h3 className="text-[#1C1C1E] font-medium mb-4">Topic Mood</h3>
              <div className="bg-[#FDFDFD] border border-gray-100 rounded-3xl p-4 shadow-sm">
                <TopicMoodItem 
                  title="Tam Sayılar" 
                  value={120} 
                  icon={<Smile size={16} />} 
                />
                <TopicMoodItem 
                  title="Üslü Sayılar" 
                  value={40} 
                  icon={<MoreHorizontal size={16} />} 
                />
                <TopicMoodItem 
                  title="Ondalık" 
                  value={85} 
                  icon={<Minus size={16} />} 
                />
              </div>
            </section>

            {/* Toast/Notification */}
            <section className="pt-4">
               <div className="bg-[#F9F9F8] p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-[#5E6E66] font-medium">Kaydedildi</span>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-xs text-gray-400">45 dk • 555 soru</span>
                     <span className="text-[10px] text-gray-300 mt-0.5">Perşembe</span>
                  </div>
               </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
