import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface VerificationButtonProps {
  contractId: string;
  status: string;
  onVerify: (id: string) => void;
  isVerifying: boolean;
  cooldown: number;
  isDisabled: boolean;
}

export function VerificationButton({ 
  contractId, 
  status, 
  onVerify, 
  isVerifying, 
  cooldown, 
  isDisabled 
}: VerificationButtonProps) {
  if (status === 'verified') return null;
  
  return (
    <Button
      onClick={() => onVerify(contractId)}
      disabled={isDisabled}
      variant="outline"
      size="sm"
      className="mr-2"
    >
      {isVerifying ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Verifying...
        </>
      ) : (
        cooldown > 0 ? (
          <>
            Retry in {cooldown}s
          </>
        ) : (
          'Verify Contract'
        )
      )}
    </Button>
  );
} 