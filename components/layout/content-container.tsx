import {
  cn,
  containerWidths,
  containerPadding,
  gridSystem,
} from '@/lib/design-system';
import type {
  ContainerWidth,
  ContainerPadding,
  GridCols,
  GridGap,
} from '@/lib/design-system';

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
  responsive?: keyof typeof gridSystem.responsiveLayouts;
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
    containerWidths[maxWidth],
    containerPadding[padding]
  );

  if (isGridContainer(props)) {
    const { cols, gap = 6, responsive } = props;
    const gridClasses = cn(
      'grid',
      responsive
        ? gridSystem.responsiveLayouts[responsive]
        : cols
          ? gridSystem.cols[cols]
          : '',
      gridSystem.gaps[gap]
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
