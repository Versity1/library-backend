import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  PanResponder,
} from 'react-native';
import { BookOpen, QrCode, BarChart3, ArrowRight, ChevronRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onComplete: () => void;
}

interface SlideData {
  title: string;
  subtitle: string;
  description: string;
  icon: 'book' | 'qr' | 'chart';
  gradient: [string, string];
  accentColor: string;
}

const SLIDES: SlideData[] = [
  {
    title: 'Shelfie',
    subtitle: 'Your Smart Library',
    description: 'Discover, borrow, and manage books effortlessly with your all-in-one library companion.',
    icon: 'book',
    gradient: ['#FFFFFF', '#F8FAFC'],
    accentColor: '#14B8A6',
  },
  {
    title: 'Scan & Borrow',
    subtitle: 'Instantly',
    description: 'Simply scan a book\'s QR code to check it out or return it. No queues, no hassle.',
    icon: 'qr',
    gradient: ['#FFFFFF', '#F8FAFC'],
    accentColor: '#3B82F6',
  },
  {
    title: 'Track Your',
    subtitle: 'Reading Journey',
    description: 'Monitor your loans, due dates, and fines. Stay on top of your reading goals.',
    icon: 'chart',
    gradient: ['#FFFFFF', '#F8FAFC'],
    accentColor: '#8B5CF6',
  },
];

const AnimatedIcon: React.FC<{ type: string; color: string; fadeAnim: Animated.Value; scaleAnim: Animated.Value }> = ({
  type,
  color,
  fadeAnim,
  scaleAnim,
}) => {
  const iconSize = 64;
  const icon =
    type === 'book' ? (
      <BookOpen size={iconSize} color={color} />
    ) : type === 'qr' ? (
      <QrCode size={iconSize} color={color} />
    ) : (
      <BarChart3 size={iconSize} color={color} />
    );

  return (
    <Animated.View
      style={[
        s.iconContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          borderColor: color + '30',
        },
      ]}
    >
      {/* Outer glow ring */}
      <Animated.View
        style={[
          s.glowRing,
          {
            borderColor: color + '15',
            transform: [
              {
                scale: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.2],
                }),
              },
            ],
          },
        ]}
      />
      {/* Inner icon circle */}
      <View style={[s.iconCircle, { backgroundColor: color + '12' }]}>
        {icon}
      </View>
    </Animated.View>
  );
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideRef = useRef(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(40)).current;
  const btnFadeAnim = useRef(new Animated.Value(0)).current;

  // Decorative floating particles
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;

  const changeSlide = (newSlide: number) => {
    slideRef.current = newSlide;
    setCurrentSlide(newSlide);
  };

  const animateIn = () => {
    // Reset
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.3);
    textFadeAnim.setValue(0);
    textSlideAnim.setValue(40);
    btnFadeAnim.setValue(0);

    Animated.sequence([
      // Icon entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Text entrance
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(textSlideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Button entrance
      Animated.timing(btnFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startParticles = () => {
    const createLoop = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    createLoop(particle1, 3000);
    createLoop(particle2, 4000);
    createLoop(particle3, 3500);
  };

  useEffect(() => {
    animateIn();
    startParticles();
  }, [currentSlide]);

  const goNext = () => {
    const cur = slideRef.current;
    if (cur < SLIDES.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        changeSlide(cur + 1);
      });
    } else {
      // Final slide → go to login
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete();
      });
    }
  };

  const goPrev = () => {
    const cur = slideRef.current;
    if (cur > 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        changeSlide(cur - 1);
      });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 20 && Math.abs(gs.dy) < Math.abs(gs.dx),
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -50) {
          goNext();
        } else if (gs.dx > 50) {
          goPrev();
        }
      },
    })
  ).current;

  const slide = SLIDES[currentSlide];
  const isLastSlide = currentSlide === SLIDES.length - 1;

  return (
    <View style={[s.container, { backgroundColor: slide.gradient[0] }]} {...panResponder.panHandlers}>
      <StatusBar barStyle="dark-content" backgroundColor={slide.gradient[0]} />

      {/* Ambient background particles */}
      <Animated.View
        style={[
          s.particle,
          {
            top: '15%',
            left: '10%',
            backgroundColor: slide.accentColor + '08',
            opacity: particle1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.8],
            }),
            transform: [
              {
                translateY: particle1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          s.particle,
          s.particleMd,
          {
            top: '60%',
            right: '8%',
            backgroundColor: slide.accentColor + '08',
            opacity: particle2.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.6],
            }),
            transform: [
              {
                translateX: particle2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 15],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          s.particle,
          s.particleSm,
          {
            top: '40%',
            right: '25%',
            backgroundColor: slide.accentColor + '0A',
            opacity: particle3.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 0.9],
            }),
          },
        ]}
      />

      {/* Skip button */}
      {!isLastSlide && (
        <TouchableOpacity style={s.skipBtn} onPress={onComplete} activeOpacity={0.7}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Main Content Area */}
      <View style={s.content}>
        {/* Animated Icon */}
        <AnimatedIcon
          type={slide.icon}
          color={slide.accentColor}
          fadeAnim={fadeAnim}
          scaleAnim={scaleAnim}
        />

        {/* Text Content */}
        <Animated.View
          style={[
            s.textContainer,
            {
              opacity: textFadeAnim,
              transform: [{ translateY: textSlideAnim }],
            },
          ]}
        >
          <Text style={s.title}>{slide.title}</Text>
          <Text style={[s.subtitle, { color: slide.accentColor }]}>{slide.subtitle}</Text>
          <Text style={s.description}>{slide.description}</Text>
        </Animated.View>
      </View>

      {/* Bottom Area */}
      <Animated.View style={[s.bottomArea, { opacity: btnFadeAnim }]}>
        {/* Dots Indicator */}
        <View style={s.dotsContainer}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                s.dot,
                idx === currentSlide
                  ? { backgroundColor: slide.accentColor, width: 28 }
                  : { backgroundColor: '#CBD5E1' },
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: slide.accentColor }]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={s.actionBtnText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
          {isLastSlide ? (
            <ArrowRight size={20} color="#FFF" />
          ) : (
            <ChevronRight size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Skip
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  skipText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  // Icon
  iconContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  glowRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text
  textContainer: {
    alignItems: 'center',
  },
  title: {
    color: '#0A192F',
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  description: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },

  // Bottom
  bottomArea: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 28,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },

  // Particles
  particle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  particleMd: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  particleSm: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
