import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Phone, Mail, MapPin, Menu, X, BookOpen, Users, Award, ChevronRight } from 'lucide-react'
import Button from '../../components/Button'

// ─── Navbar ───────────────────────────────────────────────────────
function Navbar({ onEnrollClick }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled,  setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Home',    href: '#home'    },
    { label: 'About',   href: '#about'   },
    { label: 'Courses', href: '#courses' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">JSS</span>
          </div>
          <span className={`font-semibold text-sm hidden sm:block ${scrolled ? 'text-gray-800' : 'text-white'}`}>
            Jai Shree Shyam Institute
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a key={l.label} href={l.href}
              className={`text-sm font-medium hover:text-accent transition-colors ${scrolled ? 'text-gray-700' : 'text-white'}`}>
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="accent" className="text-sm px-4 py-2">Student Login</Button>
          </Link>
          <button className="md:hidden p-1" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen
              ? <X size={22} className={scrolled ? 'text-gray-700' : 'text-white'} />
              : <Menu size={22} className={scrolled ? 'text-gray-700' : 'text-white'} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-2">
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 py-2 hover:text-primary">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────
function Hero({ onEnrollClick }) {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--hero-bg, #6C3FCF)' }}>
      {/* Background overlay — replace bg image by setting CSS var --hero-bg-image */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/90 via-primary/80 to-primary-light/70" />
      {/* Decorative circles */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto pt-20">
        <span className="inline-block bg-accent/20 text-orange-200 text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wider uppercase">
          New Delhi's Trusted Institute
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-4">
          Quality Education,<br />
          <span className="text-accent">Real Results</span>
        </h1>
        <p className="text-purple-200 text-lg mb-2">JSS Institute — Led by <span className="text-white font-semibold">Abhay Verma Sir</span></p>
        <p className="text-purple-300 text-sm mb-10 max-w-xl mx-auto">
          Empowering students across Delhi with expert coaching, live tests, and personalised learning.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="accent" className="text-base px-8 py-3" onClick={onEnrollClick}>
            Enroll Now <ChevronRight size={16} />
          </Button>
          <Link to="/login">
            <Button 
              variant="secondary" 
              className="text-base px-8 py-3 border-white/40 bg-white/5 text-white hover:bg-white/20 transition-all"
            >
              Student Login
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-60">
        <span className="text-white text-xs">Scroll down</span>
        <div className="w-0.5 h-8 bg-white/50 animate-bounce" />
      </div>
    </section>
  )
}

// ─── Gallery ──────────────────────────────────────────────────────
function Gallery() {
  const images = [
    { src: '/gallery/img1.jpg', caption: 'Our Classroom' },
    { src: '/gallery/img2.jpg', caption: 'Interactive Sessions' },
    { src: '/gallery/img3.jpg', caption: 'Student Activities' },
    { src: '/gallery/img4.jpg', caption: 'Award Ceremony' },
    { src: '/gallery/img5.jpg', caption: 'Faculty Team' },
    { src: '/gallery/img6.jpg', caption: 'Annual Results' },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-accent text-sm font-semibold uppercase tracking-wider">Our Campus</span>
          <h2 className="text-headingLg text-gray-800 mt-1">Institute Gallery</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <div key={i} className="group overflow-hidden rounded-xl shadow-sm border border-gray-100">
              <div className="relative overflow-hidden bg-gray-100 aspect-[4/3]">
                <img src={img.src} alt={img.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                />
                {/* Placeholder if image missing */}
                <div className="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                  <span className="text-primary font-semibold text-sm">{img.caption}</span>
                </div>
              </div>
              <p className="text-center text-sm text-gray-600 py-2 font-medium">{img.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── About / Faculty ──────────────────────────────────────────────
function About() {
  const stats = [
    { icon: Users,    value: '50+',  label: 'Students' },
    { icon: Award,    value: '10+',  label: 'Teachers' },
    { icon: BookOpen, value: '5+',   label: 'Subjects' },
  ]

  return (
    <section id="about" className="py-16 bg-surface">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-accent text-sm font-semibold uppercase tracking-wider">Who We Are</span>
          <h2 className="text-headingLg text-gray-800 mt-1">About the Institute</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Faculty card */}
          <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-5 items-start">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl font-bold">AV</span>
            </div>
            <div>
              <h3 className="text-headingMd text-gray-800">Abhay Verma Sir</h3>
              <p className="text-accent font-medium text-sm mt-0.5">Main Faculty — Mathematics</p>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                Dedicated educator with years of experience helping students achieve their academic goals.
                Known for making complex concepts simple and results-driven teaching methods.
              </p>
              <div className="flex flex-col gap-1 mt-3">
                <a href="tel:+919354126619" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Phone size={13} /> +91 9354126619
                </a>
                <a href="mailto:heyabhayverma.1@gmail.com" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Mail size={13} /> heyabhayverma.1@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <Icon size={20} className="text-primary" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
            {/* Mission blurb */}
            <div className="col-span-3 bg-gradient-to-r from-primary to-primary-light rounded-2xl p-5 text-white">
              <h4 className="font-semibold mb-1">Our Mission</h4>
              <p className="text-purple-100 text-sm leading-relaxed">
                To provide quality, affordable education that empowers every student to reach their full potential — with personalised attention and modern learning tools.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Courses ──────────────────────────────────────────────────────
function Courses() {
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['publicClasses'],
    queryFn:  () => axios.get('/api/public/classes').then(r => r.data),
  })

  const colors = ['from-purple-500 to-purple-700', 'from-orange-400 to-orange-600', 'from-blue-500 to-blue-700',
                  'from-green-500 to-green-700', 'from-pink-500 to-pink-700', 'from-teal-500 to-teal-700']

  return (
    <section id="courses" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-accent text-sm font-semibold uppercase tracking-wider">What We Teach</span>
          <h2 className="text-headingLg text-gray-800 mt-1">Courses Offered</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : classes.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No classes available yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {classes.map((cls, i) => (
              <div key={cls.classID} className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                <div className={`h-2 bg-gradient-to-r ${colors[i % colors.length]}`} />
                <div className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                    <BookOpen size={18} className="text-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-800">{cls.className}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cls.subject}</p>
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">Class ID: {cls.classID}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Inquiry Form ─────────────────────────────────────────────────
function InquiryForm({ open, onClose }) {
  const { data: classes = [] } = useQuery({
    queryKey: ['publicClasses'],
    queryFn:  () => axios.get('/api/public/classes').then(r => r.data),
  })

  const [form, setForm]       = useState({ name: '', phone: '', email: '', classInterested: '', message: '' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/public/inquiry', form)
      toast.success("Your inquiry has been submitted! We'll contact you soon.")
      setForm({ name: '', phone: '', email: '', classInterested: '', message: '' })
      onClose()
    } catch {
      toast.error('Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-lg">Enroll / Inquiry</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input required value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+91 9876543210" type="tel"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="rahul@example.com" type="email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Interested In</label>
            <select value={form.classInterested} onChange={e => set('classInterested', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Select a class</option>
              {classes.map(c => (
                <option key={c.classID} value={c.classID}>{c.className}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea rows={3} value={form.message} onChange={e => set('message', e.target.value)}
              placeholder="Any questions or additional info..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <Button type="submit" variant="primary" className="w-full py-2.5" loading={loading}>
            Submit Inquiry
          </Button>
        </form>
      </div>
    </div>
  )
}

// ─── Contact + Map ────────────────────────────────────────────────
function Contact() {
  return (
    <section id="contact" className="py-16 bg-surface">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-accent text-sm font-semibold uppercase tracking-wider">Find Us</span>
          <h2 className="text-headingLg text-gray-800 mt-1">Contact & Location</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Map */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-72 md:h-auto">
            <iframe
              title="JSS Institute Location"
              src="https://www.google.com/maps?q=28.703230,77.070886&hl=en&z=15&output=embed"
              width="100%" height="100%"
              style={{ border: 0 }}
              allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Address</p>
                <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">
                  B-1/32, Aman Vihar, Kirari Suleman Nagar,<br />
                  Near Budh Chowk, New Delhi - 110086
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-accent" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Phone</p>
                <a href="tel:+919354126619" className="text-primary text-sm hover:underline mt-0.5 block">
                  +91 9354126619
                </a>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Email</p>
                <a href="mailto:heyabhayverma.1@gmail.com" className="text-primary text-sm hover:underline mt-0.5 block">
                  heyabhayverma.1@gmail.com
                </a>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-5 text-white">
              <p className="font-semibold mb-1">Timings</p>
              <p className="text-purple-100 text-sm">Mon – Sat: 8:00 AM – 8:00 PM</p>
              <p className="text-purple-100 text-sm">Sunday: By appointment only</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────
function Footer({ onEnrollClick }) {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">JSS</span>
              </div>
              <span className="font-semibold text-white">Jai Shree Shyam Institute</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Quality education, real results. Serving students across Delhi since inception.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'About', 'Courses', 'Contact'].map(l => (
                <li key={l}>
                  <a href={`#${l.toLowerCase()}`} className="text-sm text-gray-400 hover:text-accent transition-colors">
                    {l}
                  </a>
                </li>
              ))}
              <li>
                <button onClick={onEnrollClick} className="text-sm text-gray-400 hover:text-accent transition-colors">
                  Enroll Now
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Contact</h4>
            <div className="space-y-2">
              <a href="tel:+919354126619"   className="flex items-center gap-2 text-sm text-gray-400 hover:text-accent"><Phone size={13}/> +91 9354126619</a>
              <a href="mailto:heyabhayverma.1@gmail.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-accent"><Mail size={13}/> heyabhayverma.1@gmail.com</a>
              <p className="flex items-start gap-2 text-sm text-gray-400"><MapPin size={13} className="mt-0.5 flex-shrink-0"/> B-1/32, Aman Vihar, Kirari Suleman Nagar, New Delhi - 110086</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-sm text-gray-500">© 2025 JSS — Jai Shree Shyam Institute. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// ─── Main LandingPage ─────────────────────────────────────────────
export default function LandingPage() {
  const [enrollOpen, setEnrollOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <Navbar onEnrollClick={() => setEnrollOpen(true)} />
      <Hero  onEnrollClick={() => setEnrollOpen(true)} />
      <Gallery />
      <About />
      <Courses />
      <Contact />
      <Footer onEnrollClick={() => setEnrollOpen(true)} />
      <InquiryForm open={enrollOpen} onClose={() => setEnrollOpen(false)} />
    </div>
  )
}