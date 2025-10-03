import { cn } from '@/lib/utils';

// Local type definitions
type ContainerWidth =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl'
  | 'full'
  | 'screen';

type ContainerPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type GridGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

type ResponsiveLayout = 'dashboard' | 'cards' | 'twoColumn' | 'threeColumn';

// Width mapping
const containerWidthClasses: Record<ContainerWidth, string> = {
  sm: 'container-sm',
  md: 'container-md',
  lg: 'container-lg',
  xl: 'container-xl',
  '2xl': 'container-2xl',
  '3xl': 'container-3xl',
  '4xl': 'container-4xl',
  '5xl': 'container-5xl',
  '6xl': 'container-6xl',
  '7xl': 'container-7xl',
  full: 'max-w-full',
  screen: 'max-w-screen-2xl',
};

// Padding mapping
const containerPaddingClasses: Record<ContainerPadding, string> = {
  none: '',
  xs: 'p-2',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
  '2xl': 'p-12',
};

// Grid columns mapping
const gridColsClasses: Record<GridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
};

// Grid gap mapping
const gridGapClasses: Record<GridGap, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
  16: 'gap-16',
};

// Responsive layouts using custom utilities
const responsiveLayoutClasses: Record<ResponsiveLayout, string> = {
  dashboard: 'grid-dashboard',
  cards: 'grid-cards',
  twoColumn: 'grid-two-column',
  threeColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
};

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: ContainerWidth;
  padding?: ContainerPadding;
  as?: 'div' | 'main' | 'section' | 'article';
}

interface GridContainerProps extends ContentContainerProps {
  grid?: true;
  cols?: GridCols;
  gap?: GridGap;
  responsive?: ResponsiveLayout;
}

type ContainerProps = ContentContainerProps | GridContainerProps;

function isGridContainer(props: ContainerProps): props is GridContainerProps {
  return 'grid' in props && props.grid === true;
}

export function ContentContainer(props: ContainerProps) {
  const {
    children,
    className,
    maxWidth = '4xl',
    padding = 'md',
    as: Component = 'div',
  } = props;

  const baseClasses = cn(
    'mx-auto w-full',
    containerWidthClasses[maxWidth],
    containerPaddingClasses[padding]
  );

  if (isGridContainer(props)) {
    const { cols, gap = 6, responsive } = props;
    const gridClasses = cn(
      'grid',
      responsive
        ? responsiveLayoutClasses[responsive]
        : cols
          ? gridColsClasses[cols]
          : '',
      gridGapClasses[gap]
    );

    return (
      <Component className={cn(baseClasses, gridClasses, className)}>
        {children}
      </Component>
    );
  }

  return (
    <Component className={cn(baseClasses, className)}>{children}</Component>
  );
}

// Convenience components for common layouts
export function GridContainer({
  children,
  className,
  maxWidth = '7xl',
  padding = 'md',
  cols,
  gap = 6,
  responsive,
  as = 'div',
}: Omit<GridContainerProps, 'grid'>) {
  return (
    <ContentContainer
      grid
      maxWidth={maxWidth}
      padding={padding}
      cols={cols}
      gap={gap}
      responsive={responsive}
      className={className}
      as={as}
    >
      {children}
    </ContentContainer>
  );
}

export function DashboardContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GridContainer
      responsive="dashboard"
      maxWidth="7xl"
      padding="md"
      gap={6}
      className={className}
    >
      {children}
    </GridContainer>
  );
}

export function CardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GridContainer
      responsive="cards"
      maxWidth="6xl"
      padding="md"
      gap={6}
      className={className}
    >
      {children}
    </GridContainer>
  );
}
