export const translations = {
  en: {
    // LoginForm
    loginForm: {
      heading: 'Mariage Tomarea 💍',
      username: 'Username',
      password: 'Password',
      signingIn: 'Signing in...',
      signIn: 'Sign In',
      loginFailed: 'Login failed',
    },

    // Dashboard
    dashboard: {
      heading: 'Mariage Tomarea 💍',
      welcome: 'Welcome, {username}',
      logout: 'Logout',
      overallProgress: 'Overall Progress:',
      totalBudget: 'Total Budget:',
      addCategory: '+ Add Category',
      addCategoryMobile: 'Category',
      loading: 'Loading...',
      noCategoriesEmpty: 'No categories yet. Create your first one!',
      createCategory: '+ Create Category',
    },

    // CategoryCard
    categoryCard: {
      expand: 'Expand category',
      collapse: 'Collapse category',
      editCategory: 'Edit category',
      deleteCategory: 'Delete category',
      noTasks: 'No tasks yet',
      addTask: '+ Add Task',
      deleteTitle: 'Delete Category',
      deleteMessage: 'Are you sure you want to delete "{name}"? This will also delete all tasks and subtasks within this category.',
    },

    // CategoryFormModal
    categoryFormModal: {
      editTitle: 'Edit Category',
      createTitle: 'Create Category',
      categoryName: 'Category Name',
      cancel: 'Cancel',
      saving: 'Saving...',
      update: 'Update',
      create: 'Create',
      saveFailed: 'Failed to save category',
    },

    // TaskCard
    taskCard: {
      expand: 'Expand task',
      collapse: 'Collapse task',
      editTask: 'Edit task',
      deleteTask: 'Delete task',
      noSubtasks: 'No subtasks yet',
      addSubtask: '+ Add Subtask',
      deleteTitle: 'Delete Task',
      deleteMessage: 'Are you sure you want to delete "{title}"? This will also delete all subtasks within this task.',
    },

    // TaskFormModal
    taskFormModal: {
      editTitle: 'Edit Task',
      createTitle: 'Create Task',
      taskTitle: 'Task Title',
      comment: 'Comment',
      cancel: 'Cancel',
      saving: 'Saving...',
      update: 'Update',
      create: 'Create',
      saveFailed: 'Failed to save task',
    },

    // SubtaskFormModal
    subtaskFormModal: {
      editTitle: 'Edit Subtask',
      createTitle: 'Create Subtask',
      subtaskTitle: 'Subtask Title',
      comment: 'Comment',
      dateLabel: 'Date (Optional)',
      clearDate: 'Clear date',
      progress: 'Progress (%)',
      weight: 'Weight',
      price: 'Price (Optional)',
      link: 'Link (Optional)',
      urgent: 'Urgent',
      important: 'Important',
      cancel: 'Cancel',
      saving: 'Saving...',
      update: 'Update',
      create: 'Create',
      saveFailed: 'Failed to save subtask',
    },

    // SubtaskItem
    subtaskItem: {
      editSubtask: 'Edit subtask',
      deleteSubtask: 'Delete subtask',
      dateLabel: 'Date:',
      linkLabel: 'Link',
      deleteTitle: 'Delete Subtask',
      deleteMessage: 'Are you sure you want to delete "{title}"?',
    },

    // ConfirmDialog
    confirmDialog: {
      delete: 'Delete',
      cancel: 'Cancel',
    },

    // Export
    export: {
      button: 'Export',
      exporting: 'Exporting…',
      fileName: 'wedding-planner',
      detailSheet: 'Detail',
      summarySheet: 'Summary',
      col: {
        element: 'Category / Task / Subtask',
        category: 'Category',
        comment: 'Comment',
        deadline: 'Deadline',
        assignee: 'Created by',
        progress: 'Progress',
        weight: 'Weight',
        price: 'Price',
        link: 'Link',
      },
      subtotal: 'Subtotal — {name}',
      categoryTotal: 'Total — {name}',
      grandTotal: 'GRAND TOTAL',
      tasksCount: 'Tasks',
      subtasksCount: 'Subtasks',
      avgProgress: 'Avg. progress',
      totalPrice: 'Total price',
      chartBudget: 'Budget by category (€)',
      chartProgress: 'Average progress by category (%)',
    },
  },

  fr: {
    // LoginForm
    loginForm: {
      heading: 'Mariage Tomarea 💍',
      username: 'Nom d\'utilisateur',
      password: 'Mot de passe',
      signingIn: 'Connexion en cours...',
      signIn: 'Se connecter',
      loginFailed: 'Échec de la connexion',
    },

    // Dashboard
    dashboard: {
      heading: 'Mariage Tomarea 💍',
      welcome: 'Bienvenue, {username}',
      logout: 'Déconnexion',
      overallProgress: 'Progression globale :',
      totalBudget: 'Budget total :',
      addCategory: '+ Ajouter une catégorie',
      addCategoryMobile: '+ Catégorie',
      loading: 'Chargement...',
      noCategoriesEmpty: 'Aucune catégorie pour le moment. Créez la première !',
      createCategory: '+ Créer une catégorie',
    },

    // CategoryCard
    categoryCard: {
      expand: 'Déplier la catégorie',
      collapse: 'Replier la catégorie',
      editCategory: 'Modifier la catégorie',
      deleteCategory: 'Supprimer la catégorie',
      noTasks: 'Aucune tâche pour le moment',
      addTask: '+ Ajouter une tâche',
      deleteTitle: 'Supprimer la catégorie',
      deleteMessage: 'Êtes-vous sûr de vouloir supprimer « {name} » ? Cela supprimera également toutes les tâches et sous-tâches de cette catégorie.',
    },

    // CategoryFormModal
    categoryFormModal: {
      editTitle: 'Modifier la catégorie',
      createTitle: 'Créer une catégorie',
      categoryName: 'Nom de la catégorie',
      cancel: 'Annuler',
      saving: 'Enregistrement...',
      update: 'Mettre à jour',
      create: 'Créer',
      saveFailed: 'Échec de l\'enregistrement de la catégorie',
    },

    // TaskCard
    taskCard: {
      expand: 'Déplier la tâche',
      collapse: 'Replier la tâche',
      editTask: 'Modifier la tâche',
      deleteTask: 'Supprimer la tâche',
      noSubtasks: 'Aucune sous-tâche pour le moment',
      addSubtask: '+ Ajouter une sous-tâche',
      deleteTitle: 'Supprimer la tâche',
      deleteMessage: 'Êtes-vous sûr de vouloir supprimer « {title} » ? Cela supprimera également toutes les sous-tâches de cette tâche.',
    },

    // TaskFormModal
    taskFormModal: {
      editTitle: 'Modifier la tâche',
      createTitle: 'Créer une tâche',
      taskTitle: 'Titre de la tâche',
      comment: 'Commentaire',
      cancel: 'Annuler',
      saving: 'Enregistrement...',
      update: 'Mettre à jour',
      create: 'Créer',
      saveFailed: 'Échec de l\'enregistrement de la tâche',
    },

    // SubtaskFormModal
    subtaskFormModal: {
      editTitle: 'Modifier la sous-tâche',
      createTitle: 'Créer une sous-tâche',
      subtaskTitle: 'Titre de la sous-tâche',
      comment: 'Commentaire',
      dateLabel: 'Date (Optionnel)',
      clearDate: 'Effacer la date',
      progress: 'Progression (%)',
      weight: 'Poids',
      price: 'Prix (Optionnel)',
      link: 'Lien (Optionnel)',
      urgent: 'Urgent',
      important: 'Important',
      cancel: 'Annuler',
      saving: 'Enregistrement...',
      update: 'Mettre à jour',
      create: 'Créer',
      saveFailed: 'Échec de l\'enregistrement de la sous-tâche',
    },

    // SubtaskItem
    subtaskItem: {
      editSubtask: 'Modifier la sous-tâche',
      deleteSubtask: 'Supprimer la sous-tâche',
      dateLabel: 'Date :',
      linkLabel: 'Lien',
      deleteTitle: 'Supprimer la sous-tâche',
      deleteMessage: 'Êtes-vous sûr de vouloir supprimer « {title} » ?',
    },

    // ConfirmDialog
    confirmDialog: {
      delete: 'Supprimer',
      cancel: 'Annuler',
    },

    // Export
    export: {
      button: 'Exporter',
      exporting: 'Export en cours…',
      fileName: 'mariage',
      detailSheet: 'Détail',
      summarySheet: 'Résumé',
      col: {
        element: 'Catégorie / Tâche / Sous-tâche',
        category: 'Catégorie',
        comment: 'Commentaire',
        deadline: 'Échéance',
        assignee: 'Créé par',
        progress: 'Progression',
        weight: 'Poids',
        price: 'Prix',
        link: 'Lien',
      },
      subtotal: 'Sous-total — {name}',
      categoryTotal: 'Total — {name}',
      grandTotal: 'TOTAL GÉNÉRAL',
      tasksCount: 'Tâches',
      subtasksCount: 'Sous-tâches',
      avgProgress: 'Progression moy.',
      totalPrice: 'Prix total',
      chartBudget: 'Budget par catégorie (€)',
      chartProgress: 'Progression moyenne par catégorie (%)',
    },
  },
} as const;

export type Language = 'en' | 'fr';
