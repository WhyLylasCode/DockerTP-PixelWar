# Pixel War - DevOps Project

## Description

Ce projet consiste à développer et déployer une application **Pixel War** permettant à plusieurs utilisateurs de modifier une grille de pixels en temps réel.

L’objectif principal est de mettre en place une **architecture complète DevOps**, incluant conteneurisation, orchestration Kubernetes et automatisation CI/CD.

---

## Architecture

L’application est composée de :

* **Backend** : Node.js (Express + Socket.IO)
* **Base de données** : PostgreSQL (persistance)
* **Cache** : Redis (temps réel)
* **Orchestration** : Kubernetes
* **Déploiement** : Helm
* **CI/CD** : GitHub Actions
* **Containerisation** : Docker

### Schéma simplifié

```
Client → Backend (Node.js)
              ↓
      Redis (temps réel)
              ↓
     PostgreSQL (persistance)
```

---

## Fonctionnalités

* Affichage d’une grille de pixels
* Modification d’un pixel (x, y, couleur)
* Synchronisation en temps réel
* Persistance des données
* Résilience via Kubernetes

---

## Docker

### Build de l’image

```bash
docker build -t pixel-war-backend .
```

### Push sur Docker Hub

```bash
docker tag pixel-war-backend wiameelalami/pixel-war-backend:latest
docker push wiameelalami/pixel-war-backend:latest
```

---

## ☸️ Kubernetes

### Déploiement

```bash
kubectl apply -f k8s/
```

### Vérification

```bash
kubectl get pods -n pixel-war
```

---

## 📦 Helm

Le déploiement est automatisé avec Helm :

```bash
helm upgrade --install pixel-war-backend ./helm/pixel-war-backend --namespace pixel-war --create-namespace
```

---

## 🔁 CI/CD

Une pipeline GitHub Actions est mise en place.

### Fonctionnement :

* À chaque **push sur la branche principale** :

  * Vérification du backend
  * Build de l’image Docker
  * Push sur Docker Hub

---

## Tests

### Vérification de l’API

```bash
kubectl port-forward svc/backend 3000:3000 -n pixel-war
```

```bash
curl http://localhost:3000/health/ready
```

---

### Test fonctionnel

```bash
curl -X POST http://localhost:3000/pixel \
  -H "Content-Type: application/json" \
  -d '{"x":1,"y":1,"color":"#FF0000"}'
```

---

### Test de résilience

```bash
kubectl delete pod -n pixel-war -l app=backend
```

➡️ Kubernetes recrée automatiquement le pod.

---

## Sécurité

* Utilisation de **Secrets Kubernetes** pour les credentials
* Configuration externalisée via **ConfigMap**

---

## Points DevOps

Ce projet met en œuvre :

* Infrastructure déclarative
* Orchestration Kubernetes
* Déploiement via Helm
* Pipeline CI/CD automatisée
* Résilience applicative
* Séparation des services

---

## Conclusion

Ce projet démontre la mise en place complète d’une architecture DevOps moderne, depuis le développement jusqu’au déploiement automatisé sur Kubernetes.

---

## Auteur

Wiame El Alami
