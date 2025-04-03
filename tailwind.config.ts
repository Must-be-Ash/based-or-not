import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			serif: [
  				'Pixelify Sans',
  				'serif'
  			]
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		backgroundImage: {
  			'dpad-gradient': 'linear-gradient(180deg, #1D1B1C 0%, #191718 81.19%, #252120 96.35%)'
  		},
  		boxShadow: {
  			dpad: '`\\n          inset 0px 0px 0.25px 1.25px #262524,\\n          inset 3px 5px 2px -4.75px #FFFFFF,\\n          inset 1.25px 1.5px 0px rgba(0, 0, 0, 0.75),\\n          inset 0px 4.75px 0.25px -2.5px #FBFBFB,\\n          inset 1px 1px 3px 3px #1A1818,\\n          inset 0px -3px 1px rgba(0, 0, 0, 0.5),\\n          inset 2.5px -2px 3px rgba(124, 108, 94, 0.75),\\n          inset 0px -3px 3px 1px rgba(255, 245, 221, 0.1)\\n        `',
  			'dpad-hover': '`\\n          inset 0px 0px 0.25px 1.25px #262524,\\n          inset 3px 5px 2px -4.75px #FFFFFF,\\n          inset 1.25px 1.5px 0px rgba(0, 0, 0, 0.75),\\n          inset 0px 4.75px 0.25px -2.5px #FBFBFB,\\n          inset 1px 1px 3px 3px #1A1818,\\n          inset 0px -3px 1px rgba(0, 0, 0, 0.5),\\n          inset 2.5px -2px 3px rgba(124, 108, 94, 0.75),\\n          inset 0px -3px 3px 1px rgba(255, 245, 221, 0.4),\\n          0px 0px 10px 1px rgba(255, 255, 255, 0.4)\\n        `',
  			'dpad-pressed': '`\\n          inset 0px 0px 0.25px 1.25px #262524,\\n          inset 1px 1px 3px 3px #1A1818,\\n          inset 0px -1px 1px rgba(0, 0, 0, 0.5)\\n        `'
  		},
  		animation: {
  			'fade-out': '1s fadeOut 3s ease-out forwards',
  			fadeIn: 'fadeIn 0.5s ease-in-out',
  			'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'ping-once': 'ping 0.8s cubic-bezier(0, 0, 0.2, 1) 1',
  			'fade-in-right': 'fadeInRight 0.4s ease-out',
  			'shiny-text': 'shiny-text 8s infinite'
  		},
  		keyframes: {
  			fadeOut: {
  				'0%': {
  					opacity: '1'
  				},
  				'100%': {
  					opacity: '0'
  				}
  			},
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			fadeInRight: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(20px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			ping: {
  				'0%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				},
  				'75%, 100%': {
  					transform: 'scale(1.2)',
  					opacity: '0'
  				}
  			},
  			'shiny-text': {
  				'0%, 90%, 100%': {
  					'background-position': 'calc(-100% - var(--shiny-width)) 0'
  				},
  				'30%, 60%': {
  					'background-position': 'calc(100% + var(--shiny-width)) 0'
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
