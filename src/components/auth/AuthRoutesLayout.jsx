import { useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import AuthLayout from './AuthLayout.jsx';

function FrozenOutlet({ outlet }) {
  const [frozenOutlet] = useState(outlet);
  return frozenOutlet;
}

export default function AuthRoutesLayout() {
  const { pathname } = useLocation();
  const outlet = useOutlet();

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <FrozenOutlet outlet={outlet} />
        </motion.div>
      </AnimatePresence>
    </AuthLayout>
  );
}
