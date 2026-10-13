// File: src/routes/admin.ts
import 'dotenv/config'
import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

const JWT_SECRET = process.env.JWT_SECRET
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!JWT_SECRET || !ADMIN_PASSWORD) {
  throw new Error('JWT_SECRET et ADMIN_PASSWORD doivent être définis dans .env')
}

// 1. Connexion Administrateur
app.post('/login', async (c) => {
  try {
    const body = await c.req.json()

    if (typeof body?.password !== 'string' || body.password !== ADMIN_PASSWORD) {
      return c.json({ success: false, message: 'Mot de passe incorrect' }, 401)
    }

    const payload = {
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 86400 // Valable 24h
    }

    const token = await sign(payload, JWT_SECRET, 'HS256')

    return c.json({
      success: true,
      message: 'Connexion réussie',
      token
    })
  } catch (error) {
    return c.json({ success: false, message: 'Requête invalide' }, 400)
  }
})

// ==========================================
// 2. MIDDLEWARE BLINDÉ (Anti-erreur de token)
// ==========================================
app.use('/*', async (c, next) => {
  // On laisse passer la route de login sans vérification
  if (c.req.path.endsWith('/login') || c.req.path === '/login') {
    return await next()
  }

  const authHeader = c.req.header('Authorization')
  
  if (!authHeader) {
    return c.json({ 
      success: false, 
      message: 'Accès refusé : En-tête Authorization manquant' 
    }, 401)
  }

  // BLINDAGE : Gère à la fois "Bearer <token>" et un token brut collé sans "Bearer"
  let token = authHeader.trim()
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.substring(7).trim()
  }

  if (!token) {
    return c.json({ 
      success: false, 
      message: 'Accès refusé : Token vide' 
    }, 401)
  }

  try {
    // Vérification sécurisée du JWT
    const payload = await verify(token, JWT_SECRET, 'HS256') as { role?: string }

    if (!payload || payload.role !== 'admin') {
      return c.json({ 
        success: false, 
        message: 'Accès refusé : Privilèges administrateur requis' 
      }, 403)
    }

    // On stocke le payload pour les routes suivantes si besoin
    c.set('jwtPayload', payload)
    await next()
    
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'Accès refusé : Token JWT invalide ou expiré' 
    }, 401)
  }
})

// 3. Lister les fiches (avec filtre optionnel par classe)
app.get('/submissions', async (c) => {
  try {
    const classe = c.req.query('classe')
    const submissions = await prisma.submission.findMany({
      where: classe ? { classe } : {},
      orderBy: { createdAt: 'desc' }
    })

    return c.json({
      success: true,
      total: submissions.length,
      data: submissions
    })
  } catch (error) {
    console.error(error)
    return c.json({ success: false, message: 'Erreur lors de la récupération des fiches' }, 500)
  }
})

// 4. Supprimer une fiche par ID
app.delete('/submissions/:id', async (c) => {
  const id = c.req.param('id')

  try {
    await prisma.submission.delete({ where: { id } })
    return c.json({ success: true, message: 'Fiche supprimée avec succès' })
  } catch (error) {
    return c.json({ success: false, message: 'Fiche introuvable ou suppression impossible' }, 404)
  }
})

export default app