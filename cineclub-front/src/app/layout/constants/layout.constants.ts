import { SideBarItem } from '../interfaces/layout.interface';
import { USER_ROLES } from '../../shared/constants/roles.constants';

export const SIDEBAR_ITEMS: SideBarItem[] = [
  {
    icon: 'home',
    title: 'Inicio',
    route: '/',
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPERADMIN],
  },
  {
    icon: 'person',
    title: 'Perfil de usuario',
    route: '/profile',
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPERADMIN],
    children: [
      {
        icon: 'visibility',
        title: 'Ver perfil',
        route: '/profile/user-profile',
      },
      {
        icon: 'group',
        title: 'Mis amigos',
        route: '/profile/my-friends',
      },
      {
        icon: 'lock',
        title: 'Cambiar contraseña',
        route: '/profile/change-password',
      },
    ],
  },
  {
    icon: 'movie',
    title: 'Películas',
    route: '/movies',
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPERADMIN],
    children: [
      {
        icon: 'star_rate',
        title: 'Top 10',
        route: '/movies/top',
      },
      {
        icon: 'video_library',
        title: 'Biblioteca',
        route: '/movies/library-movies',
      },
      {
        icon: 'personal_video',
        title: 'Mi biblioteca',
        route: '/movies/my-collections',
      },
      {
        icon: 'shuffle',
        title: 'Película aleatoria',
        route: '/movies/random',
      },
    ],
  },

  {
    icon: 'admin_panel_settings',
    title: 'Gestión',
    route: '/admin/config',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN],
    children: [
      {
        icon: 'people',
        title: 'Ver usuarios',
        route: '/organizational/see-users',
      },
    ],
  },
];
