<script setup>
import { computed } from 'vue'
import {
  Briefcase, Gift, PlusCircle, Heart, Home, Zap, Flame, Wifi, Smartphone,
  PlayCircle, Fuel, Shield, Wrench, MapPin, HeartPulse, ShieldCheck, House,
  Scale, ShoppingCart, Cat, Fish, Pill, Stethoscope, Dumbbell, GraduationCap,
  Laptop, BookOpen, Utensils, Plane, Camera, ShoppingBag, Banknote,
  CircleEllipsis, Calendar, Delete, CircleDollarSign,
  ChevronDown, ChevronLeft, ChevronRight, Check, X, Trash2, Search,
  TrendingUp, TrendingDown, Wallet, PiggyBank, AlertCircle,
} from '@lucide/vue'

const ICONS = {
  briefcase:          Briefcase,
  gift:               Gift,
  'plus-circle':      PlusCircle,
  heart:              Heart,
  home:               Home,
  zap:                Zap,
  flame:              Flame,
  wifi:               Wifi,
  smartphone:         Smartphone,
  'play-circle':      PlayCircle,
  fuel:               Fuel,
  shield:             Shield,
  wrench:             Wrench,
  'map-pin':          MapPin,
  'heart-pulse':      HeartPulse,
  'shield-check':     ShieldCheck,
  house:              House,
  scale:              Scale,
  'shopping-cart':    ShoppingCart,
  cat:                Cat,
  fish:               Fish,
  pill:               Pill,
  stethoscope:        Stethoscope,
  dumbbell:           Dumbbell,
  'graduation-cap':   GraduationCap,
  laptop:             Laptop,
  'book-open':        BookOpen,
  utensils:           Utensils,
  plane:              Plane,
  camera:             Camera,
  'shopping-bag':     ShoppingBag,
  banknote:           Banknote,
  'circle-ellipsis':  CircleEllipsis,
  calendar:           Calendar,
  delete:             Delete,
  'circle-dollar':    CircleDollarSign,
  'chevron-down':     ChevronDown,
  'chevron-left':     ChevronLeft,
  'chevron-right':    ChevronRight,
  check:              Check,
  x:                  X,
  trash:              Trash2,
  search:             Search,
  'trending-up':      TrendingUp,
  'trending-down':    TrendingDown,
  wallet:             Wallet,
  'piggy-bank':       PiggyBank,
  'alert-circle':     AlertCircle,
}

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 20 },
})

const icon = computed(() => ICONS[props.name] ?? CircleEllipsis)
</script>

<template>
  <component :is="icon" :size="size" :stroke-width="1.75" />
</template>
