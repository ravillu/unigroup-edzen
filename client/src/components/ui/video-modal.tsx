import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Brain } from "lucide-react"

export function VideoModal({ trigger }: { trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] h-[600px] p-0">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#662D91] to-[#F7941D] p-8 rounded-lg text-white text-center"
            >
              <Brain className="w-16 h-16 mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold mb-4">
                AI-Powered Group Formation
              </h2>
              <p className="text-lg mb-8 max-w-md">
                Watch how UniGroup transforms classroom collaboration through intelligent student matching and seamless Canvas integration.
              </p>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/20">
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {/* Here we'll add an animated visualization showing group formation */}
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(9)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-12 h-12 rounded-full bg-white/20"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
              <p className="mt-4 text-sm opacity-80">
                Coming soon: Watch our full product demo
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}