'use client'

import "@/i18n";
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Heart, Shield, Award, Users } from 'lucide-react';

export default function About() {
    const { t } = useTranslation();

    const values = [
        { icon: Heart, key: 'love' },
        { icon: Shield, key: 'trust' },
        { icon: Award, key: 'quality' },
        { icon: Users, key: 'family' },
    ];

    return (
        <div className="min-h-screen py-16">
            <div className="container mx-auto px-4">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
                        {t('about.title')}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        {t('about.subtitle')}
                    </p>
                </motion.div>

                {/* Description */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-4xl mx-auto mb-16"
                >
                    <div className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border border-border">
                        <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                            {t('about.description')}
                        </p>
                    </div>
                </motion.div>

                {/* Values */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {values.map((value, index) => (
                        <motion.div
                            key={value.key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="bg-card rounded-xl p-6 text-center shadow-md border border-border hover:shadow-lg transition-shadow"
                        >
                            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <value.icon className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">
                                {t(`about.values.${value.key}.title`)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {t(`about.values.${value.key}.description`)}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
