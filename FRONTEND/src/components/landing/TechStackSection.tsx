import { motion } from 'framer-motion';
import { Wifi, Camera, Shield, Cpu, Globe, Zap } from 'lucide-react';

const technologies = [
  {
    icon: Globe,
    name: 'WebRTC',
    description: 'Peer-to-peer file transfer',
    detail: 'Direct device connection',
  },
  {
    icon: Wifi,
    name: 'WebSocket',
    description: 'Real-time signaling',
    detail: 'Instant connection setup',
  },
  {
    icon: Camera,
    name: 'MediaPipe',
    description: 'Hand gesture detection',
    detail: 'ML-powered tracking',
  },
  {
    icon: Shield,
    name: 'End-to-End',
    description: 'Encrypted transfers',
    detail: 'Your data stays private',
  },
  {
    icon: Cpu,
    name: 'Three.js',
    description: '3D visualizations',
    detail: 'Immersive experience',
  },
  {
    icon: Zap,
    name: 'React',
    description: 'Modern framework',
    detail: 'Fast & responsive UI',
  },
];

export default function TechStackSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-card/50" />
        <div className="grid-pattern absolute inset-0 opacity-20" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-primary text-sm font-mono mb-4">
            {'<'} POWERED BY {'/>'}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Built with <span className="gradient-text">Modern Tech</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Cutting-edge web technologies working together for a seamless experience
          </p>
        </motion.div>

        {/* Tech grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card-hover p-6 group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <tech.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1 font-mono">{tech.name}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{tech.description}</p>
                  <span className="text-xs text-primary">{tech.detail}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Browser support badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 glass-card px-6 py-3 rounded-full">
            <Globe className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              Works in all modern browsers • No downloads required
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
