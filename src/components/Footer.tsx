import React from 'react';
import { motion } from 'framer-motion';
import { Film, Tv, Star, Heart, Coffee, Github, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      icon: Github,
      href: "#",
      label: "GitHub",
      color: "hover:text-purple-400"
    },
    {
      icon: Coffee,
      href: "#",
      label: "Buy me a coffee",
      color: "hover:text-yellow-400"
    }
  ];

  const features = [
    {
      icon: Film,
      text: "Filmes em HD",
      color: "text-blue-400"
    },
    {
      icon: Tv,
      text: "Séries Completas",
      color: "text-green-400"
    },
    {
      icon: Star,
      text: "Conteúdo Premium",
      color: "text-yellow-400"
    }
  ];

  return (
    <footer className="bg-gradient-to-t from-black via-gray-900 to-gray-800 border-t border-gray-700 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Seção Principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Logo e Descrição */}
          <div className="space-y-4">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Film className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">CinemaFluxo</h3>
            </motion.div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Sua plataforma de streaming favorita com os melhores filmes e séries. 
              Descubra, assista e se divirta com conteúdo de qualidade.
            </p>
            
            {/* Features */}
            <div className="flex flex-wrap gap-4 mt-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-full"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <feature.icon className={`h-4 w-4 ${feature.color}`} />
                  <span className="text-sm text-gray-300">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Links Rápidos */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Explore</h4>
            <div className="space-y-2">
              {[
                { name: "🎬 Filmes Populares", href: "#" },
                { name: "📺 Séries em Alta", href: "#" },
                { name: "🎲 Roleta da Sorte", href: "#" },
                { name: "⭐ Mais Avaliados", href: "#" }
              ].map((link, index) => (
                <motion.a
                  key={index}
                  href={link.href}
                  className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  {link.name}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Redes Sociais e Suporte */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Conecte-se</h4>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  className={`w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 ${social.color} transition-colors duration-200`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  title={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
            
            {/* Call to Action */}
            <motion.div
              className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4 mt-4"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-pink-400" />
                <span className="text-sm font-medium text-white">Gostou do projeto?</span>
              </div>
              <p className="text-xs text-gray-400">
                Dê uma ⭐ no GitHub e compartilhe com seus amigos!
              </p>
            </motion.div>
          </div>
        </div>

        {/* Divisor */}
        <div className="border-t border-gray-700 pt-8">
          {/* TMDB Attribution */}
          <motion.div
            className="flex flex-col md:flex-row items-center justify-between gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4">
              <img
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                alt="TMDB Logo"
                className="h-6"
              />
              <div className="text-sm text-gray-400">
                <p>Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.</p>
                <a
                  href="https://www.themoviedb.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors duration-200 inline-flex items-center gap-1"
                >
                  Visite o TMDB
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">
                © {currentYear} CinemaFluxo. Feito com{' '}
                <Heart className="inline h-4 w-4 text-red-400 mx-1" />
                para cinéfilos.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Todos os direitos reservados.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Animação de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-4 -right-4 w-24 h-24 bg-purple-600/10 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-4 -left-4 w-32 h-32 bg-pink-600/10 rounded-full blur-xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.6, 0.3, 0.6]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>
      </div>
    </footer>
  );
}