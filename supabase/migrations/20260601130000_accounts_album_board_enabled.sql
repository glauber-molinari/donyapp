-- Toggle per-account para o board de Álbuns. OFF por padrão: quem não vende
-- álbum nunca vê a opção. Ativado em Configurações → Kanban (admin + Pro).

ALTER TABLE public.accounts
  ADD COLUMN album_board_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.accounts.album_board_enabled IS
  'Quando true, a UI exibe o quadro de Álbuns e o seletor Edições/Álbuns. Toggle exige plano Pro e papel admin.';
