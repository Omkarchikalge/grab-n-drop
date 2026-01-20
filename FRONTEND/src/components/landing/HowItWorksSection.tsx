import { motion } from 'framer-motion';
import { Hand, Move, Send, Check } from 'lucide-react';

const steps = [
  {
    icon: Hand,
    title: 'Open Palm',
    description: 'Show your hand to the camera to activate gesture detection',
    color: 'primary',
  },
  {
    icon: Move,
    title: 'Grab Gesture',
    description: 'Close your hand to grab and select the file you want to transfer',
    color: 'secondary',
  },
  {
    icon: Send,
    title: 'Push Forward',
    description: 'Move your hand forward to initiate the transfer to the paired device',
    color: 'accent',
  },
  {
    icon: Check,
    title: 'Release & Drop',
    description: 'Open your hand to release the file on the receiving device',
    color: 'success',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/2 left-0 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute top-1/2 right-0 w-1/2 h-px bg-gradient-to-l from-transparent via-secondary/50 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transfer files with intuitive hand gestures. No learning curve, just natural interaction.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative group"
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-px bg-gradient-to-r from-primary/30 to-transparent" />
              )}

              <div className="glass-card-hover p-8 text-center h-full">
                {/* Step number */}
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-sm font-mono text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* Icon */}
                <div className={`inline-flex p-4 rounded-2xl mb-6 ${
                  step.color === 'primary' ? 'bg-primary/10 text-primary shadow-glow-sm' :
                  step.color === 'secondary' ? 'bg-secondary/10 text-secondary shadow-glow-purple' :
                  step.color === 'accent' ? 'bg-accent/10 text-accent' :
                  'bg-success/10 text-success'
                } group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-8 h-8" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gesture hints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 flex flex-wrap justify-center gap-4"
        >
          {['✋ Open Palm', '✊ Grab', '👉 Push', '🖐️ Release'].map((gesture) => (
            <span key={gesture} className="gesture-hint">
              {gesture}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
